import { Schema, model, Document, Types } from "mongoose";

export interface IViewedItem extends Document {
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  viewedAt: Date;
}

const viewedItemSchema = new Schema<IViewedItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Tá»± Ä‘á»™ng xÃ³a sau 7 ngÃ y
viewedItemSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export const ViewedItem = model<IViewedItem>("ViewedItem", viewedItemSchema);

