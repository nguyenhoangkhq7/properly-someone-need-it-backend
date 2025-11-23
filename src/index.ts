import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type Request, type Response } from "express";
import http from "http";
import { connectDB } from "./config/db/index";
import { env } from "./config/env";
import authRouter from "./routes/auth";
import reviewRouter from "./routes/reviews";
import chatRouter from "./routes/chat";
import itemRoutes from "./routes/itemRoutes";
import searchRoutes from "./routes/searchRoutes";
import orderRoutes from "./routes/orderRoutes";
import userRoutes from "./routes/userRoutes";
import { requestLogger } from "./middlewares/logger";
import { createChatGateway } from "./socket/chatGateway";

const app = express();
connectDB();

const allowAllOrigins = env.ALLOWED_ORIGINS.includes("*");

app.use(
  cors({
    origin: allowAllOrigins ? true : env.ALLOWED_ORIGINS,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(requestLogger);
app.use((req, _res, next) => {
  req.headers["cache-control"] = "no-store";
  next();
});

// API routes
const normalizePrefix = (value?: string) => {
  if (!value) return "";
  let prefix = value.trim();
  if (!prefix.startsWith("/")) prefix = `/${prefix}`;
  return prefix.replace(/\/+$/, "");
};

const mountRoutes = (prefix: string) => {
  app.use(`${prefix}/auth`, authRouter);
  app.use(`${prefix}/reviews`, reviewRouter);
  app.use(`${prefix}/chat`, chatRouter);
  app.use(`${prefix}/orders`, orderRoutes);
  app.use(`${prefix}/items`, itemRoutes);
  app.use(`${prefix}/search`, searchRoutes);
  app.use(`${prefix}/users`, userRoutes);

  app.get(`${prefix}/health`, (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });
};

const base = normalizePrefix(env.API_PREFIX);
mountRoutes(base);
if (base) {
  // Also expose routes without prefix to avoid 404 when clients omit it
  mountRoutes("");
}

const server = http.createServer(app);
export const io = createChatGateway(server);

server.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});

