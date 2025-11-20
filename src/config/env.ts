// src/config/env.ts
import * as dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  MONGO_URI: process.env.MONGO_URI ?? "",
  API_PREFIX: process.env.API_PREFIX ?? "/api",
};

// ❗️Kiểm tra thiếu MONGO_URI
if (!env.MONGO_URI) {
  throw new Error("Missing MONGO_URI in .env");
}
