import * as dotenv from "dotenv";
dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

const toStringArray = (value: string | undefined, fallback: string[]): string[] => {
  if (!value) return fallback;
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export const env = {
  PORT: toNumber(process.env.PORT, 3000),
  MONGO_URI: process.env.MONGO_URI ?? "mongodb://localhost:27017/psni",
  API_PREFIX: process.env.API_PREFIX ?? "/api",
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ?? "dev_access_secret",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ?? "dev_refresh_secret",
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "30d",
  ALLOWED_ORIGINS: toStringArray(process.env.ALLOWED_ORIGINS, ["*"]),
  SOCKET_ALLOWED_ORIGINS: toStringArray(process.env.SOCKET_ALLOWED_ORIGINS, ["*"]),

  OTP_TTL_MINUTES: toNumber(process.env.OTP_TTL_MINUTES, 5),
  OTP_MAX_ATTEMPTS: toNumber(process.env.OTP_MAX_ATTEMPTS, 3),
  OTP_RATE_LIMIT_WINDOW_MS: toNumber(process.env.OTP_RATE_LIMIT_WINDOW_MS, 5 * 60 * 1000),
  OTP_RATE_LIMIT_MAX: toNumber(process.env.OTP_RATE_LIMIT_MAX, 5),
  AUTH_RATE_LIMIT_WINDOW_MS: toNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 5 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: toNumber(process.env.AUTH_RATE_LIMIT_MAX, 10),

  EMAIL_FROM: process.env.EMAIL_FROM ?? "hoanpv076@gmail.com",
  SMTP_HOST: process.env.SMTP_HOST ?? "smtp.gmail.com",
  SMTP_PORT: toNumber(process.env.SMTP_PORT, 587),
  SMTP_SECURE: toBoolean(process.env.SMTP_SECURE, false),
  SMTP_USER: process.env.SMTP_USER ?? "hoanpv076@gmail.com",
  SMTP_PASS: process.env.SMTP_PASS ?? "thfracfvugmxwgos",
  // OpenRouter (ưu tiên)
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
  OPENROUTER_BASE_URL:
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1/embeddings",
  OPENROUTER_MODEL:
    process.env.OPENROUTER_MODEL ?? "openai/text-embedding-3-small",
};

if (!env.MONGO_URI) {
  throw new Error("Missing MONGO_URI in .env");
}

if (!env.OPENROUTER_API_KEY) {
  console.warn("Warning: Missing OPENROUTER_API_KEY - embeddings will fail.");
}
