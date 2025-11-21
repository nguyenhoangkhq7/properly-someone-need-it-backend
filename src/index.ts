import express from "express";
import type { Request, Response } from "express";
import { connectDB } from "./config/db/index.js";

import itemRoutes from "./routes/itemRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import { requestLogger } from "./middlewares/logger.js";

const app = express();
const PORT = 3000;

connectDB();

// Middleware để parse JSON
app.use(express.json());
app.use(requestLogger);
// Route test
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.get("/", (req: Request, res: Response) => {
  res.send("Hello TypeScript + Express!");
});
app.use("/items", itemRoutes);
app.use("/search", searchRoutes);
// Lắng nghe cổng
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
