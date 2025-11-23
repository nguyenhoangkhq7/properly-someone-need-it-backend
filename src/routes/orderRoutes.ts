import express from "express";
import type { Request, Response } from "express";
import { Order } from "../models/Order";
import { Item } from "../models/Item";
import { User } from "../models/User";
import requireAuth from "../middleware/requireAuth";

const router = express.Router();

// Láº¥y danh sÃ¡ch Ä‘Æ¡n hÃ ng theo buyer (ngÆ°á»i mua)
router.get("/buyer/:buyerId", async (req: Request, res: Response) => {
  try {
    const { buyerId } = req.params as { buyerId: string };
    const { status } = req.query as { status?: string };

    const filter: any = { buyerId };
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .lean();

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

    return res.status(200).json({ orders: result });
  } catch (error) {
    console.error("Get buyer orders error:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// Láº¥y danh sÃ¡ch Ä‘Æ¡n hÃ ng theo seller (ngÆ°á»i bÃ¡n)
router.get("/seller/:sellerId", async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params as { sellerId: string };
    const { status } = req.query as { status?: string };

    const filter: any = { sellerId };
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .lean();

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

    return res.status(200).json({ orders: result });
  } catch (error) {
    console.error("Get seller orders error:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// Láº¥y chi tiáº¿t Ä‘Æ¡n hÃ ng theo id (kÃ¨m thÃ´ng tin item cÆ¡ báº£n)
router.get("/:orderId", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params as { orderId: string };
    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ error: "ORDER_NOT_FOUND" });
    }

    const item = await Item.findById(order.itemId).lean();

    const [buyer, seller] = await Promise.all([
      User.findById(order.buyerId).lean(),
      User.findById(order.sellerId).lean(),
    ]);

    return res.status(200).json({ order, item, buyer, seller });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// Táº¡o Ä‘Æ¡n hÃ ng má»›i (buyer táº¡o Ä‘Æ¡n mua)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body as { itemId?: string };

    if (!itemId) {
      return res.status(400).json({ error: "ITEM_ID_REQUIRED" });
    }

    // Lấy buyerId từ middleware xác thực
    const buyerId = req.userId as string | undefined;
    if (!buyerId) {
      return res.status(401).json({ error: "AUTH_REQUIRED" });
    }
    const item = await Item.findById(itemId).lean();
    if (!item) {
      return res.status(404).json({ error: "ITEM_NOT_FOUND" });
    }

    const sellerId = item.sellerId;

    if (!sellerId) {
      return res.status(400).json({ error: "ITEM_SELLER_NOT_FOUND" });
    }

    if (String(buyerId) === String(sellerId)) {
      return res.status(400).json({ error: "CANNOT_BUY_OWN_ITEM" });
    }

    const priceAtPurchase = item.price;

    if (typeof priceAtPurchase !== "number") {
      return res.status(400).json({ error: "INVALID_ITEM_PRICE" });
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

    return res.status(201).json({ order });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// Cáº­p nháº­t tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng
router.patch("/:orderId/status", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params as { orderId: string };
    const { status } = req.body as { status?: string };

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

    order.status = status as any;
    await order.save();

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
});

export default router;

