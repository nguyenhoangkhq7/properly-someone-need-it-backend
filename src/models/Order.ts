import { Schema, model, Document } from "mongoose";
import type { ObjectId } from "../types/index.js";

export interface IMeetupLocation {
  address: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface IOrder extends Document {
  _id: ObjectId;
  buyerId: ObjectId;
  sellerId: ObjectId;
  itemId: ObjectId;
  priceAtPurchase: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  meetupLocation?: IMeetupLocation;
  meetupTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    priceAtPurchase: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    meetupLocation: {
      address: String,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number] },
      },
    },
    meetupTime: Date,
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });

export const Order = model<IOrder>("Order", orderSchema);
