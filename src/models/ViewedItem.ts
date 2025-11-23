import { Schema, model, Document, Types } from "mongoose";

export interface IViewedItem extends Document {
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  viewCount: number; // Đếm số lần xem -> Biết user thích cái nào hơn
  viewedAt: Date;
}

const viewedItemSchema = new Schema<IViewedItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    viewCount: { type: Number, default: 1 },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// 1. Index TTL: Tự xóa sau 7 ngày (tính từ lần xem CUỐI CÙNG)
viewedItemSchema.index(
  { viewedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 7 }
);

// 2. Compound Index: Giúp tìm nhanh và hỗ trợ Upsert (tránh trùng lặp)
viewedItemSchema.index({ userId: 1, itemId: 1 }, { unique: true }); // Mỗi user-item chỉ 1 dòng

export const ViewedItem = model<IViewedItem>("ViewedItem", viewedItemSchema);
