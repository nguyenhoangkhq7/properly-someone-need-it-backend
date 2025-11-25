import express from "express";
import type { Request, Response } from "express";
import { Order } from "../models/Order";
import { Item } from "../models/Item";
import { User } from "../models/User";
import requireAuth from "../middleware/requireAuth";

const router = express.Router();

router.use(requireAuth);

const sendSuccess = (
  res: Response,
  status: number,
  message: string,
  payload: Record<string, unknown> = {}
) => res.status(status).json({ success: true, message, ...payload });

const sendError = (
  res: Response,
  status: number,
  message: string,
  errorCode?: string
) => res.status(status).json({ success: false, message, errorCode });

// Lấy danh sách đơn hàng theo buyer (người mua)
router.get("/buyer/:buyerId", async (req: Request, res: Response) => {
  try {
    const { buyerId } = req.params as { buyerId: string };
    const requesterId = req.userId;

    if (!buyerId) {
      return sendError(res, 400, "Thiếu buyerId", "BUYER_ID_REQUIRED");
    }

    if (!requesterId) {
      return sendError(res, 401, "Bạn cần đăng nhập", "AUTH_REQUIRED");
    }

    if (String(requesterId) !== String(buyerId)) {
      return sendError(res, 403, "Không có quyền truy cập", "FORBIDDEN");
    }
    const { status } = req.query as { status?: string };

    const filter: any = { buyerId };
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

    const itemIds = orders.map((o) => o.itemId).filter(Boolean);
    const sellerIds = orders.map((o) => o.sellerId).filter(Boolean);

    const [items, sellers] = await Promise.all([
      Item.find({ _id: { $in: itemIds } }).lean(),
      User.find({ _id: { $in: sellerIds } }).lean(),
    ]);

    const itemMap = new Map(items.map((it) => [String(it._id), it]));
    const sellerMap = new Map(sellers.map((u) => [String(u._id), u]));

    const result = orders.map((order) => ({
      order,
      item: itemMap.get(String(order.itemId)) || null,
      seller: sellerMap.get(String(order.sellerId)) || null,
    }));

    return sendSuccess(res, 200, "Lấy đơn mua thành công", { orders: result });
  } catch (error) {
    console.error("Get buyer orders error:", error);
    return sendError(
      res,
      500,
      "Không thể lấy danh sách đơn mua",
      "INTERNAL_SERVER_ERROR"
    );
  }
});

// Lấy danh sách đơn hàng theo seller (người bán)
router.get("/seller/:sellerId", async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params as { sellerId: string };
    const requesterId = req.userId;

    if (!sellerId) {
      return sendError(res, 400, "Thiếu sellerId", "SELLER_ID_REQUIRED");
    }

    if (!requesterId) {
      return sendError(res, 401, "Bạn cần đăng nhập", "AUTH_REQUIRED");
    }

    if (String(requesterId) !== String(sellerId)) {
      return sendError(res, 403, "Không có quyền truy cập", "FORBIDDEN");
    }
    const { status } = req.query as { status?: string };

    const filter: any = { sellerId };
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

    const itemIds = orders.map((o) => o.itemId).filter(Boolean);
    const buyerIds = orders.map((o) => o.buyerId).filter(Boolean);

    const [items, buyers] = await Promise.all([
      Item.find({ _id: { $in: itemIds } }).lean(),
      User.find({ _id: { $in: buyerIds } }).lean(),
    ]);

    const itemMap = new Map(items.map((it) => [String(it._id), it]));
    const buyerMap = new Map(buyers.map((u) => [String(u._id), u]));

    const result = orders.map((order) => ({
      order,
      item: itemMap.get(String(order.itemId)) || null,
      buyer: buyerMap.get(String(order.buyerId)) || null,
    }));

    return sendSuccess(res, 200, "Lấy đơn bán thành công", { orders: result });
  } catch (error) {
    console.error("Get seller orders error:", error);
    return sendError(
      res,
      500,
      "Không thể lấy danh sách đơn bán",
      "INTERNAL_SERVER_ERROR"
    );
  }
});

// Lấy chi tiết đơn hàng theo id (kèm thông tin item cơ bản)
router.get("/:orderId", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params as { orderId: string };
    const requesterId = req.userId;

    if (!requesterId) {
      return sendError(res, 401, "Bạn cần đăng nhập", "AUTH_REQUIRED");
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return sendError(res, 404, "Không tìm thấy đơn hàng", "ORDER_NOT_FOUND");
    }

    const isParticipant = [order.buyerId, order.sellerId].some(
      (participantId) => String(participantId) === String(requesterId)
    );

    if (!isParticipant) {
      return sendError(res, 403, "Không có quyền truy cập", "FORBIDDEN");
    }

    const item = await Item.findById(order.itemId).lean();

    const [buyer, seller] = await Promise.all([
      User.findById(order.buyerId).lean(),
      User.findById(order.sellerId).lean(),
    ]);

    return sendSuccess(res, 200, "Lấy chi tiết đơn hàng thành công", {
      order,
      item,
      buyer,
      seller,
    });
  } catch (error) {
    console.error("Get order error:", error);
    return sendError(
      res,
      500,
      "Không thể lấy chi tiết đơn hàng",
      "INTERNAL_SERVER_ERROR"
    );
  }
});

// Tạo đơn hàng mới (buyer tạo đơn mua)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body as { itemId?: string };

    if (!itemId) {
      return sendError(res, 400, "Thiếu itemId", "ITEM_ID_REQUIRED");
    }

    // Lấy buyerId từ middleware xác thực
    const buyerId = req.userId as string | undefined;
    if (!buyerId) {
      return sendError(res, 401, "Bạn cần đăng nhập", "AUTH_REQUIRED");
    }
    const item = await Item.findById(itemId).lean();
    if (!item) {
      return sendError(res, 404, "Không tìm thấy sản phẩm", "ITEM_NOT_FOUND");
    }

    const sellerId = item.sellerId;

    if (!sellerId) {
      return sendError(
        res,
        400,
        "Không xác định được người bán",
        "ITEM_SELLER_NOT_FOUND"
      );
    }

    if (String(buyerId) === String(sellerId)) {
      return sendError(
        res,
        400,
        "Bạn không thể mua sản phẩm của chính mình",
        "CANNOT_BUY_OWN_ITEM"
      );
    }

    const priceAtPurchase = item.price;

    if (typeof priceAtPurchase !== "number") {
      return sendError(
        res,
        400,
        "Giá sản phẩm không hợp lệ",
        "INVALID_ITEM_PRICE"
      );
    }

    const meetupLocation = {
      location: item.location
        ? {
            type: "Point" as const,
            coordinates: item.location.coordinates as [number, number],
          }
        : undefined,
    };

    const order = await Order.create({
      buyerId,
      sellerId,
      itemId,
      priceAtPurchase,
      meetupLocation,
    });

    return sendSuccess(res, 201, "Tạo đơn hàng thành công", { order });
  } catch (error) {
    console.error("Create order error:", error);
    return sendError(
      res,
      500,
      "Không thể tạo đơn hàng",
      "INTERNAL_SERVER_ERROR"
    );
  }
});

// Cáº­p nháº­t tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng
router.patch(
  "/:orderId/status",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params as { orderId: string };
      const { status, cancelReason } = req.body as {
        status?: string;
        cancelReason?: string;
      };
      const userId = req.userId;
      const userRole = req.userRole;

      if (!userId) {
        return res.status(401).json({ error: "AUTH_REQUIRED" });
      }

      if (!status) {
        return res.status(400).json({ error: "STATUS_REQUIRED" });
      }

      const allowedStatus = [
        "PENDING",
        "NEGOTIATING",
        "MEETUP_SCHEDULED",
        "COMPLETED",
        "CANCELLED",
      ];

      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ error: "INVALID_STATUS" });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "ORDER_NOT_FOUND" });
      }

      const isBuyer = String(order.buyerId) === String(userId);
      const isSeller = String(order.sellerId) === String(userId);
      const isAdmin = userRole === "admin";

      if (!isBuyer && !isSeller && !isAdmin) {
        return res.status(403).json({ error: "FORBIDDEN" });
      }

      order.status = status as any;
      if (status === "CANCELLED") {
        if (isBuyer) {
          order.cancelledBy = "BUYER";
        } else if (isSeller) {
          order.cancelledBy = "SELLER";
        } else {
          order.cancelledBy = undefined;
        }
        order.cancelReason = cancelReason;
      } else {
        order.cancelledBy = undefined;
        order.cancelReason = undefined;
      }
      await order.save();

      // Nếu chuyển sang COMPLETED thì cập nhật item thành SOLD
      if (status === "COMPLETED") {
        await Item.findByIdAndUpdate(order.itemId, { status: "SOLD" });
      }

      // Náº¿u chuyá»ƒn sang MEETUP_SCHEDULED thÃ¬ há»§y cÃ¡c Ä‘Æ¡n khÃ¡c cÃ¹ng itemId
      if (status === "MEETUP_SCHEDULED") {
        await Order.updateMany(
          {
            itemId: order.itemId,
            _id: { $ne: order._id },
            status: { $in: ["PENDING", "NEGOTIATING"] },
          },
          {
            status: "CANCELLED",
            cancelledBy: "SELLER",
            cancelReason: "Another order scheduled for meetup",
          }
        );
      }

      return res.status(200).json({ order });
    } catch (error) {
      console.error("Update order status error:", error);
      return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
  }
);

export default router;
