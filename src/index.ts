import cors from "cors";
import express from "express";
import type { Request, Response } from "express";
import http from "http";
import { connectDB } from "./config/db/index.js";
import { env } from "./config/env.js";
import authRouter from "./routes/auth.js";
import reviewRouter from "./routes/reviews.js";
import chatRouter from "./routes/chat.js";
import { createChatGateway } from "./socket/chatGateway.js";

const app = express();

connectDB();

app.use(
  cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
  })
);

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
});
