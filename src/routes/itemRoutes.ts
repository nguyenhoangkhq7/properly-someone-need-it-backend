import { Router, Request, Response } from "express";
import {
  getAllItems,
  getNewItems,
  getNearbyItems,
  getRecommendedItems,
  getItemsByCategory,
  getItemById,
} from "../controllers/itemController";
import { getForYou } from "../controllers/forYouController";
import { Item } from "../models/Item";
import { User } from "../models/User";
import requireAuth from "../middleware/requireAuth";
import mongoose from "mongoose";
import { getEmbedding } from "../services/embeddingService";

const router = Router();

router.use(requireAuth);

router.get("/", getAllItems);
router.get("/new", getNewItems);
router.get("/nearby", getNearbyItems);
router.get("/recommended/:userId", getRecommendedItems);
router.get("/category/:category", getItemsByCategory);
router.get("/for-you/:userId", getForYou);

// Tao item moi
// Tao item moi
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
      return res.status(400).json({ message: "Thieu du lieu bat buoc" });
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

    // Them embedding
    try {
      const contentParts = [title, brand, modelName, description].filter(
        Boolean
      );
      const textToEmbed = contentParts.join("\n").trim();
      if (textToEmbed) {
        const embedding = await getEmbedding(textToEmbed);
        item.embedding = embedding;
      }
    } catch (embedErr) {
      console.warn("Failed to generate embedding for new item:", embedErr);
      // Khong return error, van cho tao item nhung khong co embedding
    }

    await item.save();

    return res.status(201).json(item);
  } catch (error) {
    console.error("Create item error:", error);
    return res.status(500).json({ message: "Khong the tao item" });
  }
});

// Lay danh sach item theo sellerId
router.get("/seller/:sellerId", async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res
        .status(400)
        .json({ success: false, message: "Thieu sellerId" });
    }

    const items = await Item.find({ sellerId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      message: "Lay danh sach san pham thanh cong",
      data: items,
    });
  } catch (error) {
    console.error("Get items by seller error:", error);
    return res.status(500).json({
      success: false,
      message: "Khong the lay danh sach san pham",
    });
  }
});

// Lay tat ca item (cho admin, co ten nguoi ban, ho tro loc status)
router.get("/admin", requireAuth, async (req, res) => {
  try {
    console.log("Starting /admin route, userId:", req.userId);
    console.log("MongoDB connection state:", mongoose.connection.readyState);

    // Kiem tra role admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Khong co quyen truy cap" });
    }

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
    // Doi sellerId thanh seller cho frontend de dung
    const result = items.map((item) => {
      let seller = null;
      if (
        item.sellerId &&
        typeof item.sellerId === "object" &&
        "fullName" in item.sellerId
      ) {
        seller = {
          _id: (item.sellerId as any)._id,
          fullName: (item.sellerId as any).fullName,
        };
      }
      return {
        _id: item._id,
        seller,
        sellerId: (item as any).sellerId?._id || item.sellerId,
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
    console.error("Get all items error:", error);
    return res.status(500).json({
      message: "Khong the lay danh sach san pham",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Lay chi tiet 1 item theo id (co log ViewedItem)
router.get("/:id", getItemById);
// Cap nhat trang thai item (ACTIVE, PENDING, SOLD, DELETED) - chi admin
router.patch("/:itemId/status", requireAuth, async (req: Request, res: Response) => {
  try {
    // Kiem tra role admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Khong co quyen truy cap" });
    }

    const { itemId } = req.params;
    const { status } = req.body as { status?: string };

    const allowedStatuses = ["ACTIVE", "PENDING", "SOLD", "DELETED"] as const;

    if (!status || !allowedStatuses.includes(status as any)) {
      return res.status(400).json({ message: "Trang thai khong hop le" });
    }

    const item = await Item.findByIdAndUpdate(
      itemId,
      { status },
      { new: true }
    ).lean();

    if (!item) {
      return res.status(404).json({ message: "Khong tim thay san pham" });
    }

    return res.status(200).json({ item });
  } catch (error) {
    console.error("Update item status error:", error);
    return res
      .status(500)
      .json({ message: "Khong the cap nhat trang thai san pham" });
  }
});

// NOTE: `getAllItems` is already mounted earlier (router.get('/', getAllItems));

export default router;
