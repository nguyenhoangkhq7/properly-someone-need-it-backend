import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Item } from "../models/Item";
import { ViewedItem } from "../models/ViewedItem";
import { SearchHistory } from "../models/SearchHistory";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const HISTORY_LIMIT = 20;

export const getForYou = async (req: Request, res: Response) => {
  try {
    // 1. Validation
    const requesterId = req.userId;
    if (!requesterId || !Types.ObjectId.isValid(requesterId)) {
      return res.status(401).json({ success: false, message: "AUTH_REQUIRED" });
    }
    const userId = new Types.ObjectId(requesterId);

    // 2. Fetch Data
    const [recentSearches, recentViews] = await Promise.all([
      SearchHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(HISTORY_LIMIT)
        .select("query")
        .lean(),
      ViewedItem.find({ userId })
        .sort({ viewedAt: -1 })
        .limit(HISTORY_LIMIT)
        .populate("itemId", "category subcategory brand")
        .lean(),
    ]);

    // 3. Xử lý Search Keywords
    const uniqueKeywords = new Set<string>();
    recentSearches.forEach((h) => {
      if (h.query && h.query.trim().length > 0) {
        uniqueKeywords.add(h.query.trim());
      }
    });
    const searchKeywords = Array.from(uniqueKeywords).slice(0, 5);

    // 4. Phân tích Sở thích (Category & Brand)
    const excludeItemIds: Types.ObjectId[] = [];
    const categoryScores: Record<string, number> = {};
    const brandScores: Record<string, number> = {};

    recentViews.forEach((view: any) => {
      if (view.itemId?._id) {
        excludeItemIds.push(view.itemId._id);
      }

      if (view.itemId) {
        const score = view.viewCount || 1;

        if (view.itemId.category) {
          const cat = view.itemId.category;
          categoryScores[cat] = (categoryScores[cat] || 0) + score;
        }

        if (view.itemId.brand) {
          const brand = view.itemId.brand;
          brandScores[brand] = (brandScores[brand] || 0) + score;
        }
      }
    });

    // Lấy Top 3
    const topCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    const topBrands = Object.entries(brandScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([brand]) => brand);

    // 5. Xây dựng Query
    const queryConditions: any[] = [];

    if (topBrands.length > 0) {
      queryConditions.push({ brand: { $in: topBrands } });
    }
    if (topCategories.length > 0) {
      queryConditions.push({ category: { $in: topCategories } });
    }
    if (searchKeywords.length > 0) {
      const keywordConditions = searchKeywords.map((kw) => ({
        $or: [
          { title: { $regex: escapeRegex(kw), $options: "i" } },
          { brand: { $regex: escapeRegex(kw), $options: "i" } },
        ],
      }));
      queryConditions.push(...keywordConditions);
    }

    const finalQuery: any = {
      status: "ACTIVE",
      _id: { $nin: excludeItemIds },
      sellerId: { $ne: userId },
    };

    if (queryConditions.length > 0) {
      finalQuery.$or = queryConditions;
    }

    // 6. Execute Query (Lấy pool rộng hơn để tính điểm)
    let items: any[] = [];
    if (queryConditions.length > 0) {
      // Lấy 50 items thay vì 20 để có đủ mẫu sắp xếp
      items = await Item.find(finalQuery)
        .sort({ createdAt: -1 }) // Lấy những cái mới nhất thỏa mãn điều kiện trước
        .limit(50)
        .lean();
    }

    // ======================================================
    // 7. TÍNH ĐIỂM PHÙ HỢP (RELEVANCE SCORING) - PHẦN MỚI
    // ======================================================
    if (items.length > 0) {
      items = items.map((item) => {
        let score = 0;

        // A. Trọng số Brand (Quan trọng nhất - 30 điểm)
        // Nếu xem Samsung nhiều, thì item Samsung được cộng điểm cao nhất
        if (item.brand && topBrands.includes(item.brand)) {
          score += 30;
        }

        // B. Trọng số Keyword (Quan trọng nhì - 20 điểm)
        if (
          searchKeywords.some(
            (kw) =>
              item.title?.toLowerCase().includes(kw.toLowerCase()) ||
              item.brand?.toLowerCase().includes(kw.toLowerCase())
          )
        ) {
          score += 20;
        }

        // C. Trọng số Category (Quan trọng ba - 10 điểm)
        if (item.category && topCategories.includes(item.category)) {
          score += 10;
        }

        // D. Điểm phụ cho độ phổ biến (Favorites)
        // Ví dụ: 10 tim = 1 điểm. Giúp item hot nổi lên một chút
        score += (item.favoritesCount || 0) * 0.1;

        // E. Điểm phụ cho độ mới (Recency)
        // Item mới đăng trong 24h cộng thêm 5 điểm
        const hoursSinceCreated =
          (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreated < 24) {
          score += 5;
        }

        return { ...item, relevanceScore: score };
      });

      // Sắp xếp giảm dần theo điểm
      items.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Cắt lấy 20 item điểm cao nhất
      items = items.slice(0, 20);
    }

    // 8. Fallback Logic
    if (items.length < 10) {
      const needed = 20 - items.length;
      const existingIds = items.map((i) => i._id);

      const fallbackItems = await Item.find({
        status: "ACTIVE",
        _id: { $nin: [...excludeItemIds, ...existingIds] },
        sellerId: { $ne: userId },
      })
        .sort({ createdAt: -1 })
        .limit(needed)
        .lean();

      // Gán điểm thấp cho hàng fallback để nó nằm dưới cùng
      const fallbackWithScore = fallbackItems.map((i) => ({
        ...i,
        relevanceScore: 0,
      }));
      items = [...items, ...fallbackWithScore];
    }

    return res.json({
      success: true,
      data: items,
      meta: {
        personalized: queryConditions.length > 0,
        topInterests: topCategories,
        topBrands,
        keywords: searchKeywords,
      },
    });
  } catch (err) {
    console.error("GetForYou Error:", err);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
