import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import type { Request, Response } from "express";
import http from "http";
import { connectDB } from "./config/db/index.js";
import { env } from "./config/env.js";
import authRouter from "./routes/auth.js";
import reviewRouter from "./routes/reviews.js";
import chatRouter from "./routes/chat.js";
import { createChatGateway } from "./socket/chatGateway.js";
import express, { type Request, type Response } from "express";
import { connectDB } from "./config/db";
import { Item } from "./models/Item";
import orderRoutes from "./routes/orderRoutes";

import itemRoutes from "./routes/itemRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import { requestLogger } from "./middlewares/logger.js";

const app = express();

connectDB();

app.use(
  cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json());

app.use(`${env.API_PREFIX}/auth`, authRouter);
app.use(`${env.API_PREFIX}/reviews`, reviewRouter);
app.use(`${env.API_PREFIX}/chat`, chatRouter);

app.get("/", (_req: Request, res: Response) => {
  res.send("Properly Someone Need It API");
});

const server = http.createServer(app);

export const io = createChatGateway(server);

server.listen(env.PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${env.PORT}`);
// Routes cho orders
app.use("/api/orders", orderRoutes);

app.use(requestLogger);
// Route test
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.get("/", (req: Request, res: Response) => {
  res.send("Hello TypeScript + Express!");
});

// Tạo item mới
app.post("/api/items", async (req: Request, res: Response) => {
  try {
    const {
      sellerId: _ignoredSellerId,
      title,
      description,
      category,
      subcategory,
      brand,
      modelName,
      condition,
      price,
      isNegotiable,
      images,
      location,
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      !condition ||
      price == null ||
      !location ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    const item = await Item.create({
      // sellerId: "691fcabea11a95c67d2e526a",
      sellerId: "691fcad4a11a95c67d2e526c",
      title,
      description,
      category,
      subcategory,
      brand,
      modelName,
      condition,
      price,
      isNegotiable,
      images,
      location,
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    return res.status(500).json({ message: "Không thể tạo item" });
  }
});

app.use("/items", itemRoutes);
app.use("/search", searchRoutes);
// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
