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

// Tá»± Ä‘á»™ng xÃ³a sau 7 ngÃ y
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export const SearchHistory = model<ISearchHistory>("SearchHistory", searchHistorySchema);

