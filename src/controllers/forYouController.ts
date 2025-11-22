import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Item } from "../models/Item.js";
import { ViewedItem } from "../models/ViewedItem.js";
import { SearchHistory } from "../models/SearchHistory.js";

export const getForYou = async (req: Request, res: Response) => {
  try {
    const userIdParam = (req.params.userId ?? req.query.userId ?? "").toString().trim();
    if (!userIdParam || !Types.ObjectId.isValid(userIdParam)) {
      return res.status(400).json({
        success: false,
        message: "Thiếu hoặc sai userId",
      });
    }
    const userId = new Types.ObjectId(userIdParam);

    const [viewedDocs, historyDocs] = await Promise.all([
      ViewedItem.find({ userId }).sort({ viewedAt: -1 }).limit(20).lean(),
      SearchHistory.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const viewedItemIds = viewedDocs.map((v) => v.itemId);

    let topCategories: string[] = [];
    if (viewedItemIds.length) {
      const viewedItems = await Item.find({ _id: { $in: viewedItemIds } })
        .select("category")
        .lean();
      const counts = new Map<string, number>();
      viewedItems.forEach((it) => {
        if (it.category) {
          counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
        }
      });
      topCategories = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([cat]) => cat)
        .slice(0, 5);
    }

    const searchQueries = historyDocs.map((h) => h.query).filter(Boolean).slice(0, 5);

    const filter: any = { status: "ACTIVE" };
    if (topCategories.length) filter.category = { $in: topCategories };

    const orConditions: any[] = [];
    searchQueries.forEach((q) => {
      orConditions.push({ title: { $regex: q, $options: "i" } });
      orConditions.push({ description: { $regex: q, $options: "i" } });
    });
    if (orConditions.length) filter.$or = orConditions;

    const excludeIds = viewedItemIds.length ? { _id: { $nin: viewedItemIds } } : {};

    let items = await Item.find({ ...filter, ...excludeIds })
      .sort({ favoritesCount: -1, createdAt: -1 })
      .limit(20);

    if (!items.length) {
      items = await Item.find({ status: "ACTIVE" }).sort({ createdAt: -1 }).limit(20);
    }

    return res.json({
      success: true,
      data: items,
      meta: {
        viewedCount: viewedDocs.length,
        searchQueryCount: searchQueries.length,
        usedCategories: topCategories,
      },
    });
  } catch (err) {
    console.error("ForYou error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy gợi ý cho bạn",
    });
  }
};
