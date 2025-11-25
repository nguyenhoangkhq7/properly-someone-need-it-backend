import type { Server as HTTPServer } from "http";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Server }: { Server: any } = require("socket.io");
import { env } from "../config/env";
import { verifyAccessToken } from "../utils/jwtHelper";
import { chatService, ChatServiceError } from "../services/chatService";
import { registerChatServer } from "./chatEvents";

interface AckResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

type Ack<T = unknown> = (response: AckResponse<T>) => void;

type TypingUpdatePayload = { roomId: string; isTyping: boolean };
type MessagePayload = { roomId: string; content: string };
type RoomPayload = { roomId: string };

type RoomTypingState = Map<string, Set<string>>;

const typingState: RoomTypingState = new Map();

const respond = <T>(ack: Ack<T> | undefined, payload: AckResponse<T>) => {
  if (typeof ack === "function") {
    ack(payload);
  }
};

const handleSocketError = (error: unknown, ack?: Ack) => {
  if (error instanceof ChatServiceError) {
    return respond(ack, {
      success: false,
      error: error.message,
      errorCode: error.errorCode,
    });
  }

  console.error("Socket error", error);
  return respond(ack, {
    success: false,
    error: "Đã xảy ra lỗi không mong muốn.",
    errorCode: "CHAT_SOCKET_ERROR",
  });
};

const updateTypingState = (
  roomId: string,
  userId: string,
  isTyping: boolean
) => {
  const roomState = typingState.get(roomId) ?? new Set<string>();
  const currentlyTyping = roomState.has(userId);

  if (isTyping && !currentlyTyping) {
    roomState.add(userId);
    typingState.set(roomId, roomState);
    return true;
  }

  if (!isTyping && currentlyTyping) {
    roomState.delete(userId);
    if (roomState.size === 0) {
      typingState.delete(roomId);
    } else {
      typingState.set(roomId, roomState);
    }
    return true;
  }

  return false;
};

export const createChatGateway = (server: HTTPServer) => {
  const socketOrigin: string | string[] = env.SOCKET_ALLOWED_ORIGINS.includes(
    "*"
  )
    ? "*"
    : env.SOCKET_ALLOWED_ORIGINS;

  const io = new Server(server, {
    cors: {
      origin: socketOrigin,
      credentials: true,
    },
  });

  registerChatServer(io);

  // Middleware xác thực
  io.use((socket: any, next: any) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("AUTH_REQUIRED"));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.userRole = payload.role;
      next();
    } catch (error) {
      next(new Error("TOKEN_INVALID"));
    }
  });

  io.on("connection", (socket: any) => {
    const userId = socket.data.userId as string;

    // Log để biết user nào online
    console.log(`✅ User connected: ${userId} (Socket: ${socket.id})`);

    // 1. Tự động Join tất cả phòng cũ khi kết nối (Pre-join)
    void (async () => {
      try {
        const rooms = await chatService.listRooms(userId);
        rooms.forEach((room) => {
          const roomId = room.roomId ?? room.id;
          if (roomId) {
            socket.join(roomId);
          }
        });
      } catch (err) {
        console.error("Pre-join rooms failed:", err);
      }
    })();

    // Hàm join phòng an toàn
    const safeJoin = async (roomId: string, ack?: Ack) => {
      try {
        await chatService.assertRoomAccess(roomId, userId);
        socket.join(roomId);

        // DEBUG: Kiểm tra xem phòng có bao nhiêu người
        const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        console.log(
          `➡️ User ${userId} joined room ${roomId}. Total in room: ${roomSize}`
        );

        respond(ack, { success: true });
      } catch (error) {
        handleSocketError(error, ack);
      }
    };

    // --- SỰ KIỆN: JOIN ROOM ---
    socket.on("room:join", ({ roomId }: RoomPayload, ack?: Ack) => {
      void safeJoin(roomId, ack);
    });

    // --- SỰ KIỆN: GỬI TIN NHẮN ---
    socket.on(
      "message:send",
      async ({ roomId, content }: MessagePayload, ack?: Ack) => {
        try {
          // Đảm bảo người gửi đã join socket room này
          if (!socket.rooms.has(roomId)) {
            socket.join(roomId);
          }

          const message = await chatService.createTextMessage(
            roomId,
            userId,
            content ?? ""
          );

          // 1. Phản hồi cho người gửi (để UI update ngay lập tức)
          respond(ack, { success: true, data: message });

          // 2. CHUẨN HÓA EVENT: Chỉ dùng 'message:created'
          // Gửi cho TẤT CẢ mọi người trong phòng (bao gồm cả người gửi)
          io.to(roomId).emit("message:created", message);

          // DEBUG: Kiểm tra xem tin nhắn có được gửi đi không
          const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
          console.log(
            `📡 Emitted 'message:created' to room ${roomId} (Recipients: ${roomSize})`
          );

          // 3. Cập nhật danh sách phòng chat
          const snapshot = await chatService.getRoomSnapshot(roomId);
          io.to(roomId).emit("room:updated", snapshot);
        } catch (error) {
          handleSocketError(error, ack);
        }
      }
    );

    // --- SỰ KIỆN ĐÃ ĐỌC ---
    socket.on("message:read", async ({ roomId }: RoomPayload, ack?: Ack) => {
      try {
        const result = await chatService.markAsRead(roomId, userId);
        respond(ack, { success: true, data: result });

        const snapshot = await chatService.getRoomSnapshot(roomId);

        // CHUẨN HÓA EVENT: Chỉ dùng 'room:updated'
        io.to(roomId).emit("room:updated", snapshot);

        // Event cập nhật trạng thái read
        io.to(roomId).emit("message:read_update", {
          roomId,
          userId,
          readAt: new Date(),
        });
      } catch (error) {
        handleSocketError(error, ack);
      }
    });

    // --- SỰ KIỆN TYPING ---
    socket.on(
      "typing:update",
      ({ roomId, isTyping }: TypingUpdatePayload, ack?: Ack) => {
        try {
          const changed = updateTypingState(roomId, userId, isTyping);
          if (changed) {
            // CHUẨN HÓA EVENT: Chỉ dùng 'typing:updated'
            socket
              .to(roomId)
              .emit("typing:updated", { roomId, userId, isTyping });
          }
          respond(ack, { success: true });
        } catch (error) {
          handleSocketError(error, ack);
        }
      }
    );

    socket.on("disconnect", () => {
      // console.log(`User disconnected: ${userId}`);
      // Dọn dẹp trạng thái typing
      // Lưu ý: Lúc disconnect socket.rooms đã bị clear, nên logic này cần mapping riêng nếu muốn chính xác 100%
      // Tuy nhiên với joinedRooms Set ở trên thì chưa đủ context roomId cụ thể để emit chuẩn xác khi disconnect.
      // Tạm thời bỏ qua hoặc cần implement cơ chế lưu mapping User -> Rooms global.
    });
  });

  return io;
};
