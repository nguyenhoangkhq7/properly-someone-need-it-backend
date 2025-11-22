import { Types } from "mongoose";
import { ChatRoom, Message } from "../models/index.js";
import type { IChatRoom, ITypingLog } from "../models/ChatRoom.js";
import type { IMessage } from "../models/Message.js";
import type { IUser } from "../models/User.js";
import type { IItem } from "../models/Item.js";

const { ObjectId } = Types;

const TYPING_LOG_LIMIT = 20;

export class ChatServiceError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(statusCode: number, errorCode: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

const toObjectId = (value: string): Types.ObjectId => {
  if (!ObjectId.isValid(value)) {
    throw new ChatServiceError(400, "INVALID_ID", "ID không hợp lệ.");
  }
  return new ObjectId(value);
};

const extractObjectId = (
  value: Types.ObjectId | { _id: Types.ObjectId }
): Types.ObjectId => {
  return value instanceof ObjectId ? value : value._id;
};

const ensureRoomAccess = async (roomId: string, userId: string) => {
  const room = await ChatRoom.findById(roomId)
    .populate([
      { path: "buyerId", select: "fullName avatar" },
      { path: "sellerId", select: "fullName avatar" },
      { path: "itemId", select: "title images price" },
    ])
    .exec();

  if (!room) {
    throw new ChatServiceError(404, "ROOM_NOT_FOUND", "Không tìm thấy phòng chat.");
  }

  const userObjectId = toObjectId(userId);
  const buyerObjectId = extractObjectId(room.buyerId as Types.ObjectId | { _id: Types.ObjectId });
  const sellerObjectId = extractObjectId(room.sellerId as Types.ObjectId | { _id: Types.ObjectId });

  const isBuyer = buyerObjectId.equals(userObjectId);
  const isSeller = sellerObjectId.equals(userObjectId);

  if (!isBuyer && !isSeller) {
    throw new ChatServiceError(403, "ROOM_FORBIDDEN", "Bạn không có quyền truy cập phòng này.");
  }

  return { room, isBuyer, userObjectId };
};

const transformRoom = (room: IChatRoom & {
  buyerId: Pick<IUser, "_id" | "fullName" | "avatar">;
  sellerId: Pick<IUser, "_id" | "fullName" | "avatar">;
  itemId?: Pick<IItem, "_id" | "title" | "images" | "price"> | Types.ObjectId;
}, userId: Types.ObjectId) => {
  const isBuyer = room.buyerId._id.equals(userId);
  const peer = isBuyer ? room.sellerId : room.buyerId;

  const itemDoc =
    room.itemId && typeof room.itemId === "object" && "_id" in room.itemId
      ? (room.itemId as Pick<IItem, "_id" | "title" | "images" | "price">)
      : undefined;

  return {
    id: room._id.toString(),
    roomId: room._id.toString(),
    lastMessage: room.lastMessage ?? "",
    lastMessageAt: room.lastMessageAt,
    unreadCount: isBuyer ? room.unreadCount.buyer : room.unreadCount.seller,
    peer: {
      id: peer._id.toString(),
      name: peer.fullName,
      avatar: peer.avatar ?? null,
    },
    item: itemDoc
      ? {
          id: itemDoc._id.toString(),
          title: itemDoc.title,
          thumbnail: Array.isArray(itemDoc.images) ? itemDoc.images[0] ?? null : null,
          price: itemDoc.price ?? null,
        }
      : null,
    role: isBuyer ? "buyer" : "seller",
  };
};

const buildMessageResponse = (message: IMessage) => ({
  id: message._id.toString(),
  roomId: message.chatRoomId.toString(),
  senderId: message.senderId.toString(),
  content: message.content ?? "",
  messageType: message.messageType,
  attachmentUrl: message.attachmentUrl ?? null,
  sentAt: message.sentAt,
  isRead: message.isRead,
});

const normalizeTypingLogs = (logs: ITypingLog[]) => {
  const history = logs.slice(-TYPING_LOG_LIMIT);
  const currentMap = new Map<string, ITypingLog>();

  for (const log of history) {
    const key = log.userId.toString();
    if (log.action === "START") {
      currentMap.set(key, log);
    } else {
      currentMap.delete(key);
    }
  }

  const current = Array.from(currentMap.values()).map((log) => ({
    userId: log.userId.toString(),
    since: log.timestamp,
  }));

  return {
    history: history.map((log) => ({
      userId: log.userId.toString(),
      action: log.action,
      timestamp: log.timestamp,
    })),
    current,
  };
};

export const chatService = {
  async listRooms(userId: string) {
    const userObjectId = toObjectId(userId);
    const rooms = await ChatRoom.find({
      $or: [{ buyerId: userObjectId }, { sellerId: userObjectId }],
    })
      .populate([
        { path: "buyerId", select: "fullName avatar" },
        { path: "sellerId", select: "fullName avatar" },
        { path: "itemId", select: "title images price" },
      ])
      .sort({ lastMessageAt: -1 })
      .exec();

    return rooms.map((room) => transformRoom(room as any, userObjectId));
  },

  async fetchMessages(roomId: string, userId: string, options?: { before?: string; limit?: number }) {
    await ensureRoomAccess(roomId, userId);

    const limit = Math.min(options?.limit ?? 30, 100);
    const filter: Record<string, unknown> = { chatRoomId: toObjectId(roomId) };

    if (options?.before) {
      const beforeDate = new Date(options.before);
      if (Number.isNaN(beforeDate.getTime())) {
        throw new ChatServiceError(400, "INVALID_CURSOR", "Thời gian không hợp lệ.");
      }
      filter.sentAt = { $lt: beforeDate };
    }

    const messages = await Message.find(filter)
      .sort({ sentAt: -1 })
      .limit(limit)
      .exec();

    return messages.reverse().map(buildMessageResponse);
  },

  async createTextMessage(roomId: string, userId: string, content: string) {
    if (!content || !content.trim()) {
      throw new ChatServiceError(400, "EMPTY_MESSAGE", "Nội dung tin nhắn không được để trống.");
    }

    const { room, userObjectId, isBuyer } = await ensureRoomAccess(roomId, userId);

    const message = await Message.create({
      chatRoomId: room._id,
      senderId: userObjectId,
      content: content.trim(),
      messageType: "TEXT",
    });

    const receiverKey = isBuyer ? "seller" : "buyer";

    await ChatRoom.findByIdAndUpdate(room._id, {
      $set: {
        lastMessage: message.content,
        lastMessageAt: message.sentAt,
      },
      $inc: {
        [`unreadCount.${receiverKey}`]: 1,
      },
    }).exec();

    return buildMessageResponse(message);
  },

  async markAsRead(roomId: string, userId: string) {
    const { room, isBuyer } = await ensureRoomAccess(roomId, userId);

    const receiverKey = isBuyer ? "buyer" : "seller";

    await Message.updateMany(
      {
        chatRoomId: room._id,
        senderId: { $ne: toObjectId(userId) },
        isRead: false,
      },
      { $set: { isRead: true } }
    ).exec();

    await ChatRoom.findByIdAndUpdate(room._id, {
      $set: {
        [`unreadCount.${receiverKey}`]: 0,
      },
    }).exec();

    return { roomId, unreadKey: receiverKey };
  },

  async getTypingLogs(roomId: string, userId: string) {
    const { room } = await ensureRoomAccess(roomId, userId);
    const normalized = normalizeTypingLogs(room.typingLogs ?? []);
    return normalized;
  },

  async appendTypingLog(roomId: string, userId: string, action: "START" | "STOP") {
    await ensureRoomAccess(roomId, userId);

    const updateResult = await ChatRoom.findByIdAndUpdate(
      roomId,
      {
        $push: {
          typingLogs: {
            $each: [{ userId: toObjectId(userId), action, timestamp: new Date() }],
            $slice: -TYPING_LOG_LIMIT,
          },
        },
      },
      { new: true }
    ).exec();

    if (!updateResult) {
      throw new ChatServiceError(404, "ROOM_NOT_FOUND", "Không tìm thấy phòng chat.");
    }

    return normalizeTypingLogs(updateResult.typingLogs ?? []);
  },

  async clearTypingLogs(roomId: string, userId: string) {
    const { room } = await ensureRoomAccess(roomId, userId);

    room.typingLogs = [];
    await room.save();

    return { roomId };
  },

  async getRoomSnapshot(roomId: string) {
    const room = await ChatRoom.findById(roomId).lean<IChatRoom>();
    if (!room) {
      throw new ChatServiceError(404, "ROOM_NOT_FOUND", "Không tìm thấy phòng chat.");
    }

    return {
      roomId: room._id.toString(),
      lastMessage: room.lastMessage ?? "",
      lastMessageAt: room.lastMessageAt,
      buyerId: room.buyerId.toString(),
      sellerId: room.sellerId.toString(),
      unreadCount: {
        buyer: room.unreadCount.buyer,
        seller: room.unreadCount.seller,
      },
    };
  },
};

export const typingLogLimit = TYPING_LOG_LIMIT;
