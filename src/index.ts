import express from "express";
import type { Request, Response } from "express";
import { connectDB } from "./config/db/index.js";
import { env } from "./config/env.js";
import authRouter from "./routes/auth.js";
import reviewRouter from "./routes/reviews.js";

const app = express();

connectDB();

app.use(express.json());

app.use(`${env.API_PREFIX}/auth`, authRouter);
app.use(`${env.API_PREFIX}/reviews`, reviewRouter);

app.get("/", (_req: Request, res: Response) => {
  res.send("Properly Someone Need It API");
});

app.listen(env.PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${env.PORT}`);
});
