import { Schema, model, Document } from "mongoose";
import { env } from "../config/env.js";

export type OtpPurpose = "login" | "register";

export interface IEmailOtp extends Document {
  email: string;
  otpHash: string;
  purpose: OtpPurpose;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IEmailOtp>(
  {
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    purpose: { type: String, enum: ["login", "register"], required: true },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: env.OTP_MAX_ATTEMPTS,
    },
    expiresAt: {
      type: Date,
      default: (): Date => new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000),
      expires: 0,
    },
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export const EmailOtp = model<IEmailOtp>("EmailOtp", otpSchema);
