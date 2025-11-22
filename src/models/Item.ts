// src/models/Item.ts
import { Schema, model, Document } from "mongoose";
import type { ObjectId } from "../types/index.js";

export interface IItemLocation {
  type: "Point";
  coordinates: [number, number];
}

export interface IItem extends Document {
  _id: ObjectId;
  sellerId: ObjectId;

  title: string;
  description: string;

  category:
    | "PHONE"
    | "LAPTOP"
    | "TABLET"
    | "WATCH"
    | "HEADPHONE"
    | "ACCESSORY"
    | "OTHER";
  subcategory?: string;
  brand?: string;
  modelName?: string;

  condition: "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

  price: number;
  isNegotiable: boolean;

  images: string[];
  location: IItemLocation;

  status: "ACTIVE" | "PENDING" | "SOLD" | "DELETED";

  views: number;
  favoritesCount: number;
  embedding?: number[];

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
      enum: [
        "PHONE",
        "LAPTOP",
        "TABLET",
        "WATCH",
        "HEADPHONE",
        "ACCESSORY",
        "OTHER",
      ],
      required: true,
    },
    subcategory: String,
    brand: String,
    modelName: String,

    condition: {
      type: String,
      enum: ["LIKE_NEW", "GOOD", "FAIR", "POOR"],
      required: true,
    },

    price: { type: Number, required: true, min: 0 },
    isNegotiable: { type: Boolean, default: true },

    images: [{ type: String, required: true }],

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "PENDING", "SOLD", "DELETED"],
      default: "ACTIVE",
    },

    views: { type: Number, default: 0 },
    favoritesCount: { type: Number, default: 0 },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

itemSchema.index({ location: "2dsphere" });
itemSchema.index({ category: 1, subcategory: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ sellerId: 1 });

export const Item = model<IItem>("Item", itemSchema);
