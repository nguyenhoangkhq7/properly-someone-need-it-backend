import { Schema, model, Document } from "mongoose";
import type { ObjectId } from "../types/index.js";

export interface IItemLocation {
  type: "Point";
  coordinates: [number, number];
}

// src/models/Item.ts

export interface IItem extends Document {
  _id: ObjectId;
  sellerId: ObjectId;
  title: string;
  description: string;
  category: "PHONE" | "LAPTOP" | "TABLET" | "ACCESSORY" | "OTHER";
  subcategory?: string;
  tags: string[];
  brand?: string;
  deviceModel?: string;
  condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
  price: number;
  originalPrice?: number;
  isNegotiable: boolean;
  images: string[];
  location: IItemLocation;
  status: "ACTIVE" | "SOLD" | "PENDING" | "DELETED";
  views: number;
  favoritesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["PHONE", "LAPTOP", "TABLET", "ACCESSORY", "OTHER"],
      required: true,
    },
    subcategory: String,
    tags: [{ type: String, lowercase: true }],
    brand: String,
    deviceModel: String,
    condition: {
      type: String,
      enum: ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    isNegotiable: { type: Boolean, default: true },
    images: [{ type: String }],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SOLD", "PENDING", "DELETED"],
      default: "ACTIVE",
    },
    views: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
itemSchema.index({ location: "2dsphere" });
itemSchema.index({ category: 1, subcategory: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ sellerId: 1 });

export const Item = model<IItem>("Item", itemSchema);
