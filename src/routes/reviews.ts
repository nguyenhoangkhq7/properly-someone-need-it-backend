import { Router } from "express";
import type { Request, Response } from "express";
import mongoose, { isValidObjectId } from "mongoose";
import { Review } from "../models/Review";
import { sendError, sendSuccess } from "../utils/response";
import requireAuth from "../middleware/requireAuth";

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
      return sendError(res, 400, "SellerId khÃ´ng há»£p lá»‡", "SELLER_INVALID");
    }

    const reviews = await Review.find({ sellerId })
      .sort({ createdAt: -1 })
      .populate("reviewerId", "fullName avatar address")
      .lean();

    const stats = buildStats(reviews.map((review) => review.rating));

    return sendSuccess(res, { reviews, stats }, "Láº¥y danh sÃ¡ch Ä‘Ã¡nh giÃ¡ thÃ nh cÃ´ng");
  } catch (error) {
    console.error("GET /reviews/:sellerId error", error);
    return sendError(res, 500, "KhÃ´ng thá»ƒ láº¥y danh sÃ¡ch Ä‘Ã¡nh giÃ¡", "REVIEW_FETCH_FAILED");
  }
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sellerId, rating, comment, orderId, itemId } = req.body ?? {};
    if (!sellerId || !isValidObjectId(sellerId)) {
      return sendError(res, 400, "SellerId khÃ´ng há»£p lá»‡", "SELLER_INVALID");
    }

    const ratingNumber = Number(rating);
    if (!Number.isFinite(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return sendError(res, 400, "Rating pháº£i náº±m trong khoáº£ng 1-5", "RATING_INVALID");
    }

    const reviewerId = req.userId;
    if (!reviewerId) {
      return sendError(res, 401, "Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ Ä‘Ã¡nh giÃ¡", "AUTH_REQUIRED");
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

    return sendSuccess(res, populated, "ÄÃ¡nh giÃ¡ Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n");
  } catch (error) {
    console.error("POST /reviews error", error);
    return sendError(res, 500, "KhÃ´ng thá»ƒ lÆ°u Ä‘Ã¡nh giÃ¡", "REVIEW_CREATE_FAILED");
  }
});

export default router;

