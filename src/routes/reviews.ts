import { Router } from "express";
import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { Review } from "../models/Review";
import { sendError, sendSuccess } from "../utils/response";
import requireAuth from "../middleware/requireAuth";
import { Order } from "../models/Order";

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

router.get("/eligible/:sellerId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const buyerId = req.userId;

    if (!buyerId) {
      return sendError(res, 401, "Bạn cần đăng nhập", "AUTH_REQUIRED");
    }

    if (!sellerId || !isValidObjectId(sellerId)) {
      return sendError(res, 400, "SellerId không hợp lệ", "SELLER_INVALID");
    }

    if (buyerId.toString() === sellerId.toString()) {
      return sendSuccess(
        res,
        { eligible: false, reason: "Bạn không thể tự đánh giá shop của mình." },
        "Không đủ điều kiện"
      );
    }

    const lastCompletedOrder = await Order.findOne({
      buyerId,
      sellerId,
      status: "COMPLETED",
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!lastCompletedOrder) {
      return sendSuccess(
        res,
        { eligible: false, reason: "Bạn chưa có đơn hoàn tất với shop này." },
        "Không đủ điều kiện"
      );
    }

    const existingReview = await Review.findOne({
      reviewerId: buyerId,
      sellerId,
      orderId: lastCompletedOrder._id,
    })
      .select("_id")
      .lean();

    if (existingReview) {
      return sendSuccess(
        res,
        {
          eligible: false,
          reason: "Bạn đã đánh giá sau đơn gần nhất.",
          reviewId: existingReview._id,
        },
        "Đã đánh giá"
      );
    }

    return sendSuccess(
      res,
      {
        eligible: true,
        orderId: lastCompletedOrder._id,
        itemId: lastCompletedOrder.itemId,
      },
      "Đủ điều kiện"
    );
  } catch (error) {
    console.error("GET /reviews/eligible/:sellerId error", error);
    return sendError(res, 500, "Không kiểm tra được điều kiện", "ELIGIBILITY_FAILED");
  }
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sellerId, rating, comment, images } = req.body ?? {};
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

    if (reviewerId.toString() === sellerId.toString()) {
      return sendError(res, 403, "Không thể tự đánh giá shop của mình", "REVIEW_FORBIDDEN");
    }

    if (images && (!Array.isArray(images) || images.length > 3)) {
      return sendError(res, 400, "Tối đa 3 ảnh minh họa", "IMAGES_INVALID");
    }

    const completedOrder = await Order.findOne({
      buyerId: reviewerId,
      sellerId,
      status: "COMPLETED",
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!completedOrder) {
      return sendError(
        res,
        403,
        "Bạn cần có đơn hoàn tất với shop này để đánh giá",
        "REVIEW_FORBIDDEN"
      );
    }

    const duplicateReview = await Review.findOne({
      reviewerId,
      sellerId,
      orderId: completedOrder._id,
    }).lean();

    if (duplicateReview) {
      return sendError(res, 409, "Bạn đã đánh giá đơn gần nhất", "REVIEW_EXISTS");
    }

    const sanitizedImages = Array.isArray(images)
      ? images.filter((url) => typeof url === "string").slice(0, 3)
      : [];

    const review = await Review.create({
      sellerId,
      reviewerId,
      rating: ratingNumber,
      comment,
      images: sanitizedImages,
      orderId: completedOrder._id,
      itemId: completedOrder.itemId,
    });

    const populated = await review.populate("reviewerId", "fullName avatar address");

    return sendSuccess(res, populated, "Đánh giá đã được ghi nhận");
  } catch (error) {
    console.error("POST /reviews error", error);
    return sendError(res, 500, "Không thể lưu đánh giá", "REVIEW_CREATE_FAILED");
  }
});

export default router;

