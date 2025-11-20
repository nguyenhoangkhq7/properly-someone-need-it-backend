import { Router } from "express";
import type { Request, Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";
import { Review } from "../models/Review.js";
import { sendError, sendSuccess } from "../utils/response.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

const buildStats = (ratings: number[]) => {
  const total = ratings.length;
  if (!total) {
    return { total: 0, averageRating: 0 };
  }
  const sum = ratings.reduce((acc, value) => acc + value, 0);
  return {
    total,
    averageRating: Number((sum / total).toFixed(2)),
  };
};

router.get("/:sellerId", async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    if (!sellerId || !isValidObjectId(sellerId)) {
      return sendError(res, 400, "SellerId không hợp lệ", "SELLER_INVALID");
    }

    const reviews = await Review.find({ sellerId })
      .sort({ createdAt: -1 })
      .populate("reviewerId", "fullName avatar address")
      .lean();

    const stats = buildStats(reviews.map((review) => review.rating));

    return sendSuccess(res, { reviews, stats }, "Lấy danh sách đánh giá thành công");
  } catch (error) {
    console.error("GET /reviews/:sellerId error", error);
    return sendError(res, 500, "Không thể lấy danh sách đánh giá", "REVIEW_FETCH_FAILED");
  }
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sellerId, rating, comment, orderId, itemId } = req.body ?? {};
    if (!sellerId || !isValidObjectId(sellerId)) {
      return sendError(res, 400, "SellerId không hợp lệ", "SELLER_INVALID");
    }

    const ratingNumber = Number(rating);
    if (!Number.isFinite(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return sendError(res, 400, "Rating phải nằm trong khoảng 1-5", "RATING_INVALID");
    }

    const reviewerId = req.userId;
    if (!reviewerId) {
      return sendError(res, 401, "Bạn cần đăng nhập để đánh giá", "AUTH_REQUIRED");
    }

    const review = await Review.create({
      sellerId,
      reviewerId,
      rating: ratingNumber,
      comment,
      orderId:
        orderId && isValidObjectId(orderId)
          ? orderId
          : new mongoose.Types.ObjectId(),
      itemId:
        itemId && isValidObjectId(itemId)
          ? itemId
          : new mongoose.Types.ObjectId(),
    });

    const populated = await review.populate("reviewerId", "fullName avatar address");

    return sendSuccess(res, populated, "Đánh giá đã được ghi nhận");
  } catch (error) {
    console.error("POST /reviews error", error);
    return sendError(res, 500, "Không thể lưu đánh giá", "REVIEW_CREATE_FAILED");
  }
});

export default router;
