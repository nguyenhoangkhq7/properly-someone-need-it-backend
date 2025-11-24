// src/config/db/index.ts
import mongoose from "mongoose";
import { env } from "../env";

export const connectDB = async () => {
  try {
    // Kiểm tra trước
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
