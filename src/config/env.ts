import * as dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  MONGO_URI: process.env.MONGO_URI ?? "",
  API_PREFIX: process.env.API_PREFIX ?? "/api",
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
