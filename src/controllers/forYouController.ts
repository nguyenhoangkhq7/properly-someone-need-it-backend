import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Item } from "../models/Item";
import { ViewedItem } from "../models/ViewedItem";
import { SearchHistory } from "../models/SearchHistory";

export const getForYou = async (req: Request, res: Response) => {
  try {
    // 1. Validation & Parsing userId
    const userIdRaw = req.params.userId ?? req.query.userId;
    const userIdParam = String(userIdRaw || "").trim();

    if (!userIdParam || !Types.ObjectId.isValid(userIdParam)) {
      return res.status(400).json({
        success: false,
        message: "Thiếu hoặc sai định dạng userId",
      });
    }
    const userId = new Types.ObjectId(userIdParam);

    // 2. Lấy dữ liệu hành vi người dùng (Parallel Fetching)
    const [viewedDocs, historyDocs] = await Promise.all([
      ViewedItem.find({ userId })
        .sort({ viewedAt: -1 })
        .limit(20)
        .select("itemId")
        .lean(),
      SearchHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("query")
        .lean(),
    ]);

    const viewedItemIds = viewedDocs.map((v) => v.itemId);

    // 3. Phân tích Top Categories (Tối ưu logic đếm)
    let topCategories: string[] = [];
    if (viewedItemIds.length > 0) {
      // Chỉ lấy field category để nhẹ query
      const viewedItemsDetails = await Item.find({
        _id: { $in: viewedItemIds },
      })
        .select("category")
        .lean();

      const categoryCounts = viewedItemsDetails.reduce((acc, item) => {
        if (item.category) {
          acc[item.category] = (acc[item.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      topCategories = Object.entries(categoryCounts)
        .sort(([, countA], [, countB]) => countB - countA) // Sort giảm dần
        .slice(0, 5) // Lấy top 5
        .map(([cat]) => cat);
    }

    // 4. Chuẩn bị từ khóa tìm kiếm
    const searchQueries = historyDocs
      .map((h) => h.query?.trim())
      .filter((q): q is string => !!q); // Type guard lọc null/empty

    // 5. Xây dựng Query thông minh (Logic OR thay vì AND)
    const queryConditions: any[] = [];

    // Điều kiện A: Thuộc category hay xem
    if (topCategories.length > 0) {
      queryConditions.push({ category: { $in: topCategories } });
    }

    // Điều kiện B: Khớp từ khóa tìm kiếm (Chỉ tìm Title để tối ưu performance)
    if (searchQueries.length > 0) {
      // Tạo regex cho mỗi từ khóa
      const searchRegexes = searchQueries.map((q) => ({
        title: { $regex: q, $options: "i" },
      }));
      queryConditions.push(...searchRegexes);
    }

    // Base Filter
    const finalQuery: any = {
      status: "ACTIVE",
      _id: { $nin: viewedItemIds }, // Loại trừ items đã xem
    };

    // Nếu có điều kiện sở thích/tìm kiếm thì dùng $or, ngược lại query rỗng (sẽ fail xuống fallback)
    if (queryConditions.length > 0) {
      finalQuery.$or = queryConditions;
    }

    // 6. Thực thi Query chính
    let items: any[] = [];
    if (queryConditions.length > 0) {
      items = await Item.find(finalQuery)
        .sort({ favoritesCount: -1, createdAt: -1 }) // Ưu tiên item hot & mới
        .limit(20)
        .lean();
    }

    // 7. Fallback: Nếu không có gợi ý hoặc user mới (Cold start)
    // Lấy các item mới nhất
    if (items.length === 0) {
      items = await Item.find({
        status: "ACTIVE",
        _id: { $nin: viewedItemIds }, // Vẫn nên loại trừ cái đã xem
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }

    return res.json({
      success: true,
      data: items,
      meta: {
        recommendationType:
          queryConditions.length > 0 ? "personalized" : "latest",
        usedCategories: topCategories,
        usedKeywords: searchQueries,
      },
    });
  } catch (err) {
    console.error("ForYou Error:", err);
    // Đảm bảo encoding message tiếng Việt đúng
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy gợi ý cho bạn",
    });
  }
};
