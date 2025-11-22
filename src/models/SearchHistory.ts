import { Schema, model, Document, Types } from "mongoose";

export interface ISearchHistory extends Document {
  userId: Types.ObjectId;
  query: string;
  createdAt: Date;
}

const searchHistorySchema = new Schema<ISearchHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    query: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Tự động xóa sau 7 ngày
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export const SearchHistory = model<ISearchHistory>("SearchHistory", searchHistorySchema);
