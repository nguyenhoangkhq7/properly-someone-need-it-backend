import { Router, type Request } from "express";
import requireAuth from "../middleware/requireAuth";
import { sendError, sendSuccess } from "../utils/response";
import { chatService, ChatServiceError } from "../services/chatService";
import { chatEvents } from "../socket/chatEvents";

const router = Router();

router.use(requireAuth);

router.use((req, res, next) => {
  if (!req.userId) {
    return sendError(res, 401, "Báº¡n cáº§n Ä‘Äƒng nháº­p.", "AUTH_REQUIRED");
  }
  return next();
});

const getUserId = (req: Request) => req.userId as string;

const handleError = (error: unknown, res: Parameters<typeof sendError>[0]) => {
  if (error instanceof ChatServiceError) {
    return sendError(res, error.statusCode, error.message, error.errorCode);
  }

  console.error("Chat route error", error);
  return sendError(
    res,
    500,
    "ÄÃ£ xáº£y ra lá»—i khÃ´ng mong muá»‘n.",
    "CHAT_SERVER_ERROR"
  );
};

router.get("/rooms", async (req, res) => {
  try {
    const userId = getUserId(req);
    const rooms = await chatService.listRooms(userId);
    return sendSuccess(res, rooms);
  } catch (error) {
    return handleError(error, res);
  }
});

router.post("/initiate", async (req, res) => {
  try {
    const userId = getUserId(req);
    // targetId ở đây là ID của người bán (sellerId) được gửi từ frontend
    const { targetId } = req.body as { targetId: string };

    if (!targetId) {
      return sendError(
        res,
        400,
        "Thiếu ID người nhận (targetId).",
        "INVALID_PARAMS"
      );
    }

    // Gọi service để tìm phòng cũ hoặc tạo mới
    // Lưu ý: Bạn cần đảm bảo chatService có hàm initiateChat hoặc findOrCreateRoom
    const room = await chatService.initiateChat(userId, targetId);

    // Bắn socket báo có phòng mới (nếu cần)
    // chatEvents.roomCreated(room);

    return sendSuccess(res, room, "Đã kết nối phòng chat.");
  } catch (error) {
    return handleError(error, res);
  }
});

router.get("/rooms/:roomId/messages", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { before, limit } = req.query;
    const fetchOptions: { before?: string; limit?: number } = {};
    if (typeof before === "string") {
      fetchOptions.before = before;
    }
    if (typeof limit === "string" && !Number.isNaN(Number(limit))) {
      fetchOptions.limit = Number(limit);
    }

    const messages = await chatService.fetchMessages(
      req.params.roomId,
      userId,
      fetchOptions
    );

    return sendSuccess(res, messages);
  } catch (error) {
    return handleError(error, res);
  }
});

router.post("/rooms/:roomId/messages", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { content } = req.body as { content?: string };
    const roomId = req.params.roomId;
    const message = await chatService.createTextMessage(
      roomId,
      userId,
      content ?? ""
    );

    const snapshot = await chatService.getRoomSnapshot(roomId);
    chatEvents.messageCreated(roomId, message);
    chatEvents.roomUpdated(snapshot);

    return sendSuccess(res, message, "ÄÃ£ gá»­i tin nháº¯n.");
  } catch (error) {
    return handleError(error, res);
  }
});

router.patch("/rooms/:roomId/read", async (req, res) => {
  try {
    const userId = getUserId(req);
    const roomId = req.params.roomId;
    const result = await chatService.markAsRead(roomId, userId);
    const snapshot = await chatService.getRoomSnapshot(roomId);
    chatEvents.roomUpdated(snapshot);
    return sendSuccess(res, result, "ÄÃ£ Ä‘Ã¡nh dáº¥u Ä‘Ã£ Ä‘á»c.");
  } catch (error) {
    return handleError(error, res);
  }
});

export default router;
