import { Types } from "mongoose";
import { ChatRoom, Message } from "../models/index";
import type { IChatRoom } from "../models/ChatRoom";
import type { IMessage } from "../models/Message";
import type { IUser } from "../models/User";
import type { IItem } from "../models/Item";

const { ObjectId } = Types;

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
    throw new ChatServiceError(400, "INVALID_ID", "ID khÃ´ng há»£p lá»‡.");
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
    throw new ChatServiceError(
      404,
      "ROOM_NOT_FOUND",
      "KhÃ´ng tÃ¬m tháº¥y phÃ²ng chat."
    );
  }

  const userObjectId = toObjectId(userId);
  const buyerObjectId = extractObjectId(
    room.buyerId as Types.ObjectId | { _id: Types.ObjectId }
  );
  const sellerObjectId = extractObjectId(
    room.sellerId as Types.ObjectId | { _id: Types.ObjectId }
  );

  const isBuyer = buyerObjectId.equals(userObjectId);
  const isSeller = sellerObjectId.equals(userObjectId);

  if (!isBuyer && !isSeller) {
    throw new ChatServiceError(
      403,
      "ROOM_FORBIDDEN",
      "Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p phÃ²ng nÃ y."
    );
  }

  return { room, isBuyer, userObjectId };
};

const transformRoom = (
  room: IChatRoom & {
    buyerId: Pick<IUser, "_id" | "fullName" | "avatar">;
    sellerId: Pick<IUser, "_id" | "fullName" | "avatar">;
    itemId?: Pick<IItem, "_id" | "title" | "images" | "price"> | Types.ObjectId;
  },
  userId: Types.ObjectId
) => {
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
          thumbnail: Array.isArray(itemDoc.images)
            ? itemDoc.images[0] ?? null
            : null,
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

  async initiateChat(userId: string, targetId: string) {
    const userObjectId = toObjectId(userId);
    const targetObjectId = toObjectId(targetId);

    // 1. Validate: Không thể chat với chính mình
    if (userObjectId.equals(targetObjectId)) {
      throw new ChatServiceError(
        400,
        "SELF_CHAT",
        "Không thể chat với chính mình."
      );
    }

    // 2. Tìm xem đã có phòng chat giữa 2 người chưa
    // Logic: Tìm phòng mà (User là Buyer, Target là Seller) HOẶC (User là Seller, Target là Buyer)
    let room = await ChatRoom.findOne({
      $or: [
        { buyerId: userObjectId, sellerId: targetObjectId },
        { buyerId: targetObjectId, sellerId: userObjectId },
      ],
    }).exec();

    // 3. Nếu chưa có phòng -> Tạo mới
    if (!room) {
      // Mặc định: Người chủ động nhắn tin (userId) sẽ là Buyer
      // targetId sẽ là Seller
      // Lưu ý: Hiện tại frontend chỉ gửi targetId, chưa gửi itemId nên tạm thời itemId = undefined
      room = await ChatRoom.create({
        buyerId: userObjectId,
        sellerId: targetObjectId,
        unreadCount: { buyer: 0, seller: 0 },
        lastMessage: null,
        lastMessageAt: new Date(),
        // Nếu sau này bạn muốn gắn chat vào đúng sản phẩm, hãy update API để nhận thêm itemId
        itemId: undefined,
      });
    }

    // 4. Populate dữ liệu đầy đủ để trả về cho Client (cần Avatar, Tên...)
    const populatedRoom = await ChatRoom.findById(room._id)
      .populate([
        { path: "buyerId", select: "fullName avatar" },
        { path: "sellerId", select: "fullName avatar" },
        { path: "itemId", select: "title images price" },
      ])
      .exec();

    if (!populatedRoom) {
      throw new ChatServiceError(
        500,
        "CREATE_FAILED",
        "Không thể khởi tạo phòng chat."
      );
    }

    // 5. Transform dữ liệu về đúng format ChatRoomSummary mà frontend cần
    return transformRoom(populatedRoom as any, userObjectId);
  },

  async fetchMessages(
    roomId: string,
    userId: string,
    options?: { before?: string; limit?: number }
  ) {
    await ensureRoomAccess(roomId, userId);

    const limit = Math.min(options?.limit ?? 30, 100);
    const filter: Record<string, unknown> = { chatRoomId: toObjectId(roomId) };

    if (options?.before) {
      const beforeDate = new Date(options.before);
      if (Number.isNaN(beforeDate.getTime())) {
        throw new ChatServiceError(
          400,
          "INVALID_CURSOR",
          "Thá»i gian khÃ´ng há»£p lá»‡."
        );
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
      throw new ChatServiceError(
        400,
        "EMPTY_MESSAGE",
        "Ná»™i dung tin nháº¯n khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng."
      );
    }

    const { room, userObjectId, isBuyer } = await ensureRoomAccess(
      roomId,
      userId
    );

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

  async getRoomSnapshot(roomId: string) {
    const room = await ChatRoom.findById(roomId).lean<IChatRoom>();
    if (!room) {
      throw new ChatServiceError(
        404,
        "ROOM_NOT_FOUND",
        "KhÃ´ng tÃ¬m tháº¥y phÃ²ng chat."
      );
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
  async assertRoomAccess(roomId: string, userId: string) {
    await ensureRoomAccess(roomId, userId);
  },
};
