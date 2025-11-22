let chatServer: any | null = null;

export const registerChatServer = (server: any) => {
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
};


