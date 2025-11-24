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

const router = Router();

router.use(requireAuth);

router.get("/", getAllItems);
router.get("/new", getNewItems);
router.get("/nearby", getNearbyItems);
router.get("/recommended/:userId", getRecommendedItems);
router.get("/category/:category", getItemsByCategory);
router.get("/for-you/:userId", getForYou);

// Tạo item mới
router.post("/", async (req: Request, res: Response) => {
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

    const item = await Item.create({
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
      return res
        .status(400)
        .json({ success: false, message: "Thiếu sellerId" });
    }

    const items = await Item.find({ sellerId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm thành công",
      data: items,
    });
  } catch (error) {
    console.error("Get items by seller error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách sản phẩm",
    });
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
