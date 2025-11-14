import express from "express";
import type { Request, Response } from "express";
import { connectDB } from "./config/db/index.js";

const app = express();
const PORT = 3000;

connectDB();

// Middleware để parse JSON
app.use(express.json());

// Route test
app.get("/", (req: Request, res: Response) => {
  res.send("Hello TypeScript + Express!");
});

// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
