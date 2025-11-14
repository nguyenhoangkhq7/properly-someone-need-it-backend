import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";
import type { ObjectId } from "../types/index.js";

export interface ILocation {
  type: "Point";
  coordinates: [number, number];
}

export interface IAccount {
  username: string;
  password: string;
  email: string;
}

export interface IUser extends Document {
  _id: ObjectId;
  fullName: string;
  account: IAccount;
  role: "USER" | "ADMIN";
  phone?: string;
  address?: {
    street?: string;
    district?: string;
    city?: string;
    location?: ILocation;
  };
  wishlist: string[]; // lưu item._id dưới dạng string
  avatar?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    account: {
      username: { type: String, required: true, unique: true, trim: true },
      password: { type: String, required: true, minlength: 6 },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
    },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    phone: { type: String, trim: true },
    address: {
      street: String,
      district: String,
      city: String,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    wishlist: [{ type: String }], // string[]
    avatar: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    fcmToken: String,
  },
  { timestamps: true }
);

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("account.password")) return next();
  this.account.password = await bcrypt.hash(this.account.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.account.password);
};

userSchema.index({ "address.location": "2dsphere" });

export const User = model<IUser>("User", userSchema);
