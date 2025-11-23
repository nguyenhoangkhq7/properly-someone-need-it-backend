import { Schema, model, Document, Types } from "mongoose";

// 1. CẬP NHẬT INTERFACE: Thêm lastSearchedAt vào đây
export interface ISearchHistory extends Document {
  userId: Types.ObjectId;
  query: string;
  lastSearchedAt: Date; // <--- Thêm dòng này để khớp với Schema
}

// 2. Schema (Giữ nguyên logic tối ưu)
const searchHistorySchema = new Schema<ISearchHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    query: { type: String, required: true, trim: true },
    // count: { type: Number, default: 1 }, // (Optional) Nếu bạn muốn đếm số lần tìm
    lastSearchedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false, // Tắt timestamps mặc định vì ta tự quản lý lastSearchedAt
  }
);

// Index TTL: Xóa sau 7 ngày tính từ lastSearchedAt
searchHistorySchema.index(
  { lastSearchedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 7 }
);

// Index tìm kiếm nhanh: Tìm user đó đã search từ khóa gì gần đây nhất
searchHistorySchema.index({ userId: 1, lastSearchedAt: -1 });

export const SearchHistory = model<ISearchHistory>(
  "SearchHistory",
  searchHistorySchema
);
