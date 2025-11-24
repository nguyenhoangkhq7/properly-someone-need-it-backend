import { Router, Request, Response } from "express";
import {
  getAllItems,
  getNewItems,
  getNearbyItems,
  getRecommendedItems,
  getItemsByCategory,
} from "../controllers/itemController";
import { getForYou } from "../controllers/forYouController";
import { Item } from "../models/Item";
import requireAuth from "../middleware/requireAuth";
import mongoose from "mongoose";
import { getEmbedding } from "../services/embeddingService";

const router = Router();

router.get("/", getAllItems);
router.get("/new", getNewItems);
router.get("/nearby", getNearbyItems);
router.get("/recommended/:userId", getRecommendedItems);
router.get("/category/:category", getItemsByCategory);
router.get("/for-you/:userId", getForYou);

// Tạo item mới
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      sellerId: _ignoredSellerId,
      title,
      description,
      category,
      subcategory,
      brand,
      modelName,
      condition,
      price,
      isNegotiable,
      images,
      location,
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      !condition ||
      price == null ||
      !location ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    const sellerId = req.userId as string | undefined;
    if (!sellerId) {
      return res.status(401).json({ message: "AUTH_REQUIRED" });
    }

    const item = new Item({
      sellerId,
      title,
      description,
      category,
      subcategory,
      brand,
      modelName,
      condition,
      price,
      isNegotiable,
      images,
      location,
      status: "PENDING",
    });

    // Thêm embedding
    try {
      const contentParts = [title, brand, modelName, description].filter(Boolean);
      const textToEmbed = contentParts.join("\n").trim();
      if (textToEmbed) {
        const embedding = await getEmbedding(textToEmbed);
        item.embedding = embedding;
      }
    } catch (embedErr) {
      console.warn("Failed to generate embedding for new item:", embedErr);
      // Không return error, vẫn cho tạo item nhưng không có embedding
    }

    await item.save();

    return res.status(201).json(item);
  } catch (error) {
    console.error("Create item error:", error);
    return res.status(500).json({ message: "Không thể tạo item" });
  }
});

// Lấy danh sách item theo sellerId
router.get("/seller/:sellerId", async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({ message: "Thiếu sellerId" });
    }

    const items = await Item.find({ sellerId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Get items by seller error:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách item" });
  }
});

// Lấy tất cả item (cho admin, có tên người bán, hỗ trợ lọc status)
router.get("/admin", requireAuth, async (req, res) => {
  try {
    console.log("Starting /admin route, userId:", req.userId);
    console.log("MongoDB connection state:", mongoose.connection.readyState); // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "Database not connected" });
    }
    const { status } = req.query;
    const filter: { [key: string]: any } = {};
    if (status && typeof status === "string") {
      filter.status = status;
    }
    console.log("Filter:", filter);
    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "sellerId", select: "fullName" })
      .lean();
    console.log("Items fetched successfully, count:", items.length);
    // Đổi sellerId thành seller cho frontend dễ dùng
    const result = items.map((item) => {
      let seller = null;
      if (item.sellerId && typeof item.sellerId === 'object' && 'fullName' in item.sellerId) {
        seller = {
          _id: item.sellerId._id,
          fullName: item.sellerId.fullName,
        };
      }
      return {
        _id: item._id,
        seller,
        sellerId: item.sellerId?._id || item.sellerId,
        title: item.title,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        brand: item.brand,
        modelName: item.modelName,
        condition: item.condition,
        price: item.price,
        isNegotiable: item.isNegotiable,
        images: item.images,
        location: item.location,
        status: item.status,
        views: item.views,
        favoritesCount: item.favoritesCount,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get all items error:", error); // Enhanced logging
    return res.status(500).json({ message: "Không thể lấy danh sách sản phẩm", error: error instanceof Error ? error.message : String(error) });
  }
});

// Lấy chi tiết 1 item theo id
router.get("/:itemId", async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findById(itemId).lean();

    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    return res.status(200).json({ item });
  } catch (error) {
    console.error("Get item detail error:", error);
    return res.status(500).json({ message: "Không thể lấy chi tiết sản phẩm" });
  }
});

// Cập nhật trạng thái item (ACTIVE, PENDING, SOLD, DELETED)
router.patch(
  "/:itemId/status",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const { status } = req.body as { status?: string };

      const allowedStatuses = ["ACTIVE", "PENDING", "SOLD", "DELETED"] as const;

      if (!status || !allowedStatuses.includes(status as any)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      const item = await Item.findByIdAndUpdate(
        itemId,
        { status },
        { new: true }
      ).lean();

      if (!item) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      return res.status(200).json({ item });
    } catch (error) {
      console.error("Update item status error:", error);
      return res
        .status(500)
        .json({ message: "Không thể cập nhật trạng thái sản phẩm" });
    }
  }
);

// NOTE: `getAllItems` is already mounted earlier (router.get('/', getAllItems));

export default router;
