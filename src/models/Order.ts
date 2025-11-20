// src/models/Order.ts
import { Schema, model, Document } from "mongoose";
import type { ObjectId } from "../types/index.js";

export interface IMeetupLocation {
  address?: string;
  placeName?: string;
  placeType?: "CAFE" | "MALL" | "PARK" | "HOME" | "OTHER";
  location?: {
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
  finalPrice?: number;

  status:
    | "PENDING"
    | "NEGOTIATING"
    | "MEETUP_SCHEDULED"
    | "COMPLETED"
    | "CANCELLED";

  meetupLocation?: IMeetupLocation;
  meetupTime?: Date;

  cancelledBy?: "BUYER" | "SELLER";
  cancelReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },

    priceAtPurchase: { type: Number, required: true },
    finalPrice: Number,

    status: {
      type: String,
      enum: [
        "PENDING",
        "NEGOTIATING",
        "MEETUP_SCHEDULED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    meetupLocation: {
      address: String,
      placeName: String,
      placeType: {
        type: String,
        enum: ["CAFE", "MALL", "PARK", "HOME", "OTHER"],
      },
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number] },
      },
    },
    meetupTime: Date,

    cancelledBy: { type: String, enum: ["BUYER", "SELLER"] },
    cancelReason: String,
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1 });
orderSchema.index({ sellerId: 1 });
orderSchema.index({ status: 1 });

export const Order = model<IOrder>("Order", orderSchema);
