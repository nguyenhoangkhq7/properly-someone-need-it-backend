// src/models/User.ts
import { Schema, model, Document } from "mongoose";
import type { ObjectId } from "../types/index.js";

export interface ILocation {
  type: "Point";
  coordinates: [number, number];
}

export type UserRole = "user" | "admin";

export interface IUser extends Document {
  _id: ObjectId;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  refreshToken?: string | null;

  address: {
    city: string;
    district?: string;
    location?: ILocation;
  };

  rating: number;
  reviewCount: number;
  successfulTrades: number;
  cancelledTrades: number;
  trustScore: number;

  isVerified: boolean;
  verifiedAt?: Date;

  isBanned: boolean;
  banReason?: string;
  bannedAt?: Date;

  fcmTokens: string[];
  lastActiveAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, required: true, unique: true, trim: true },

    avatar: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    refreshToken: { type: String, default: null },

    address: {
      city: { type: String, required: true },
      district: String,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },

    rating: { type: Number, default: 5.0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    successfulTrades: { type: Number, default: 0 },
    cancelledTrades: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },

    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,

    isBanned: { type: Boolean, default: false },
    banReason: String,
    bannedAt: Date,

    fcmTokens: [{ type: String }],
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index quan trọng
userSchema.index({ "address.location": "2dsphere" });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ trustScore: -1 });
userSchema.index({ successfulTrades: -1 });
userSchema.index({ rating: -1 });

export const User = model<IUser>("User", userSchema);
