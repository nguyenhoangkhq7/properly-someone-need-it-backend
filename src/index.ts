import express, { type Request, type Response } from "express";
import { connectDB } from "./config/db";
import { Item } from "./models/Item";
import orderRoutes from "./routes/orderRoutes";

const app = express();
const PORT = 3000;

connectDB();

// Middleware để parse JSON
app.use(express.json());

// Routes cho orders
app.use("/api/orders", orderRoutes);

// Route test
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

// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
