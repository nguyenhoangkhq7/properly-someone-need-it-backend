import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { chatService, ChatServiceError } from "../services/chatService.js";
import { chatEvents } from "../socket/chatEvents.js";

const router = Router();

router.use(requireAuth);

const handleError = (error: unknown, res: Parameters<typeof sendError>[0]) => {
  if (error instanceof ChatServiceError) {
    return sendError(res, error.statusCode, error.message, error.errorCode);
  }

  console.error("Chat route error", error);
  return sendError(res, 500, "Đã xảy ra lỗi không mong muốn.", "CHAT_SERVER_ERROR");
};

router.get("/rooms", async (req, res) => {
  try {
    if (!req.userId) {
      return sendError(res, 401, "Bạn cần đăng nhập.", "AUTH_REQUIRED");
    }

    const rooms = await chatService.listRooms(req.userId);
    return sendSuccess(res, rooms);
  } catch (error) {
    return handleError(error, res);
  }
});

router.get("/rooms/:roomId/messages", async (req, res) => {
  try {
    if (!req.userId) {
      return sendError(res, 401, "Bạn cần đăng nhập.", "AUTH_REQUIRED");
    }

    const { before, limit } = req.query;
    const fetchOptions: { before?: string; limit?: number } = {};
    if (typeof before === "string") {
      fetchOptions.before = before;
    }
    if (typeof limit === "string" && !Number.isNaN(Number(limit))) {
      fetchOptions.limit = Number(limit);
    }

    const messages = await chatService.fetchMessages(req.params.roomId, req.userId, fetchOptions);

    return sendSuccess(res, messages);
  } catch (error) {
    return handleError(error, res);
  }
});

router.post("/rooms/:roomId/messages", async (req, res) => {
  try {
    if (!req.userId) {
      return sendError(res, 401, "Bạn cần đăng nhập.", "AUTH_REQUIRED");
    }

    const { content } = req.body as { content?: string };
    const roomId = req.params.roomId;
    const message = await chatService.createTextMessage(roomId, req.userId, content ?? "");

    const snapshot = await chatService.getRoomSnapshot(roomId);
    chatEvents.messageCreated(roomId, message);
    chatEvents.roomUpdated(snapshot);

    return sendSuccess(res, message, "Đã gửi tin nhắn.");
  } catch (error) {
    return handleError(error, res);
  }
});

router.patch("/rooms/:roomId/read", async (req, res) => {
  try {
    if (!req.userId) {
      return sendError(res, 401, "Bạn cần đăng nhập.", "AUTH_REQUIRED");
    }

    const roomId = req.params.roomId;
    const result = await chatService.markAsRead(roomId, req.userId);
    const snapshot = await chatService.getRoomSnapshot(roomId);
    chatEvents.roomUpdated(snapshot);
    return sendSuccess(res, result, "Đã đánh dấu đã đọc.");
  } catch (error) {
    return handleError(error, res);
  }
});

export default router;
