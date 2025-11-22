import type { Server } from "socket.io";

let chatServer: Server | null = null;

export const registerChatServer = (server: Server) => {
  chatServer = server;
};

export const chatEvents = {
  messageCreated(roomId: string, payload: unknown) {
    chatServer?.to(roomId).emit("message:new", payload);
  },
  roomUpdated(snapshot: {
    roomId: string;
    lastMessage: string;
    lastMessageAt: Date;
    buyerId: string;
    sellerId: string;
    unreadCount: { buyer: number; seller: number };
  }) {
    chatServer?.to(snapshot.roomId).emit("room:update", snapshot);
  },
  typingUpdated(roomId: string, payload: unknown) {
    chatServer?.to(roomId).emit("typing:update", payload);
  },
  typingCleared(roomId: string) {
    chatServer?.to(roomId).emit("typing:cleared", { roomId });
  },
};
