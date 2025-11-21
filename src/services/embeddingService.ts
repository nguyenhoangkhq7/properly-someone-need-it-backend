import axios from "axios";
import { env } from "../config/env.js";

const MAX_RETRY = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getEmbedding = async (text: string): Promise<number[]> => {
  if (!text.trim()) return [];

  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt += 1) {
    try {
      const response = await axios.post(
        env.OPENROUTER_BASE_URL,
        { model: env.OPENROUTER_MODEL, input: text },
        {
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": process.env.APP_NAME || "PSNI-Backend",
          },
          timeout: 15000,
        }
      );
      const embedding = response.data?.data?.[0]?.embedding as
        | number[]
        | undefined;
      if (!embedding?.length) throw new Error("Empty embedding returned");
      return embedding;
    } catch (err: any) {
      lastErr = err;
      const code = err?.code;
      if (
        code !== "ECONNRESET" &&
        code !== "ECONNABORTED" &&
        code !== "ETIMEDOUT"
      ) {
        break; // lỗi khác -> không retry
      }
      if (attempt < MAX_RETRY) await sleep(500 * attempt); // backoff nhẹ
    }
  }
  console.error("Error generating embedding:", lastErr);
  throw new Error("Failed to generate embedding");
};
