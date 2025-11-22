import { Schema, model, Document } from "mongoose";
import type { ObjectId } from "../types/index";

export interface IReview extends Document {
  _id: ObjectId;
  orderId: ObjectId;
  reviewerId: ObjectId;
  sellerId: ObjectId;
  itemId: ObjectId;
  rating: number;
  comment?: string;
  images: string[];
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    images: [{ type: String }],
  },
  { timestamps: true }
);

reviewSchema.index({ sellerId: 1, createdAt: -1 });

export const Review = model<IReview>("Review", reviewSchema);

