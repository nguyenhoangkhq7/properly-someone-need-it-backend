import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Item } from "../models/Item";
import { ViewedItem } from "../models/ViewedItem";

// =======================
// 1) GET ALL ITEMS
// =======================
export const getAllItems = async (req: Request, res: Response) => {
  try {
    const items = await Item.find({ status: "ACTIVE" }).sort({ createdAt: -1 });
    console.log(
      "ðŸ”¥ ITEMS FOUND:",
      (await Item.find({ status: "ACTIVE" })).length
    );

    return res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Lá»—i server",
    });
  }
};

// =======================
// 2) GET ITEM BY ID
// =======================
export const getItemById = async (req: Request, res: Response) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m",
      });
    }

    const userId = req.userId;
    if (userId && Types.ObjectId.isValid(userId)) {
      ViewedItem.findOneAndUpdate(
        { userId, itemId: item._id },
        { $inc: { viewCount: 1 }, $set: { viewedAt: new Date() } },
        { upsert: true, new: true }
      ).catch((err) => console.error("Log viewed item error:", err));
    }

    return res.json({
      success: true,
      data: item,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Lá»—i server",
    });
  }
};

// =======================
// 3) GET NEW ITEMS (recent)
// =======================
export const getNewItems = async (req: Request, res: Response) => {
  try {
    const items = await Item.find({ status: "ACTIVE" })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Lá»—i server",
    });
  }
};

// =======================
// 4) GET NEARBY ITEMS
// =======================
// /items/nearby?lat=10.8&lng=106.7&radius=5000
export const getNearbyItems = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Thiáº¿u tham sá»‘ lat hoáº·c lng",
      });
    }

    const items = await Item.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(radius),
        },
      },
      status: "ACTIVE",
    });

    return res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Lá»—i server khi tÃ¬m Nearby Items",
    });
  }
};

// =======================
// 5) GET RECOMMENDED ITEMS
// =======================
// Dá»±a trÃªn lá»‹ch sá»­ tÃ¬m kiáº¿m / danh má»¥c Ä‘Ã£ xem / wishlist / táº¡m thá»i Ä‘Æ¡n giáº£n
export const getRecommendedItems = async (req: Request, res: Response) => {
  try {
    // ðŸ”¥ Sau nÃ y báº¡n thÃªm logic ML, AI, thá»‘ng kÃª hÃ nh vi á»Ÿ Ä‘Ã¢y
    // Táº¡m thá»i: gá»£i Ã½ sáº£n pháº©m má»›i nháº¥t + cÃ¹ng danh má»¥c mÃ  user hay xem
    const items = await Item.find({ status: "ACTIVE" })
      .sort({ favoritesCount: -1, createdAt: -1 })
      .limit(20);

    return res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Lá»—i khi láº¥y recommended items",
    });
  }
};

// =======================
// 6) GET ITEMS BY CATEGORY
// =======================
export const getItemsByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Thiáº¿u category",
      });
    }

    const items = await Item.find({
      status: "ACTIVE",
      category: category.toUpperCase(),
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Lá»—i server khi láº¥y items theo category",
    });
  }
};

