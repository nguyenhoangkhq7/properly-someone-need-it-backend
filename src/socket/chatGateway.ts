import type { Server as HTTPServer } from "http";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Server }: { Server: any } = require("socket.io");
import { env } from "../config/env";
import { verifyAccessToken } from "../utils/jwtHelper";
import { chatService, ChatServiceError } from "../services/chatService";
import { chatEvents, registerChatServer } from "./chatEvents";

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
    error: "ÄÃ£ xáº£y ra lá»—i khÃ´ng mong muá»‘n.",
    errorCode: "CHAT_SOCKET_ERROR",
  });
};

const updateTypingState = (roomId: string, userId: string, isTyping: boolean) => {
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
  const socketOrigin: string | string[] =
    env.SOCKET_ALLOWED_ORIGINS.includes("*") ? "*" : env.SOCKET_ALLOWED_ORIGINS;

  const io = new Server(server, {
    cors: {
      origin: socketOrigin,
      credentials: true,
    },
  });

  registerChatServer(io);

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
    const joinedRooms = new Set<string>();

    const safeJoin = async (roomId: string, ack?: Ack) => {
      try {
        await chatService.assertRoomAccess(roomId, userId);
        socket.join(roomId);
        joinedRooms.add(roomId);
        respond(ack, { success: true });
      } catch (error) {
        handleSocketError(error, ack);
      }
    };

    socket.on("room:join", ({ roomId }: RoomPayload, ack?: Ack) => {
      void safeJoin(roomId, ack);
    });

    socket.on("message:send", async ({ roomId, content }: MessagePayload, ack?: Ack) => {
      try {
        const message = await chatService.createTextMessage(roomId, userId, content ?? "");
        respond(ack, { success: true, data: message });

        chatEvents.messageCreated(roomId, message);
        const snapshot = await chatService.getRoomSnapshot(roomId);
        chatEvents.roomUpdated(snapshot);
      } catch (error) {
        handleSocketError(error, ack);
      }
    });

    socket.on("message:read", async ({ roomId }: RoomPayload, ack?: Ack) => {
      try {
        const result = await chatService.markAsRead(roomId, userId);
        respond(ack, { success: true, data: result });

        const snapshot = await chatService.getRoomSnapshot(roomId);
        chatEvents.roomUpdated(snapshot);
      } catch (error) {
        handleSocketError(error, ack);
      }
    });

    socket.on("typing:update", ({ roomId, isTyping }: TypingUpdatePayload, ack?: Ack) => {
      try {
        if (!joinedRooms.has(roomId)) {
          respond(ack, {
            success: false,
            error: "Báº¡n chÆ°a tham gia phÃ²ng nÃ y.",
            errorCode: "ROOM_NOT_JOINED",
          });
          return;
        }

        const changed = updateTypingState(roomId, userId, isTyping);
        if (changed) {
          chatEvents.typingUpdated(roomId, { roomId, userId, isTyping });
        }
        respond(ack, { success: true });
      } catch (error) {
        handleSocketError(error, ack);
      }
    });

    socket.on("disconnect", () => {
      joinedRooms.forEach((roomId) => {
        const changed = updateTypingState(roomId, userId, false);
        if (changed) {
          chatEvents.typingUpdated(roomId, { roomId, userId, isTyping: false });
        }
      });
    });
  });

  return io;
};



