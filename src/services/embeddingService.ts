import axios from "axios";
import { env } from "../config/env.js";

export const getEmbedding = async (text: string): Promise<number[]> => {
  if (!text.trim()) return [];

  try {
    const response = await axios.post(
      env.OPENROUTER_BASE_URL,
      {
        model: env.OPENROUTER_MODEL,
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          // OpenRouter khuyến khích gửi thông tin referrer/title để định danh nguồn gọi
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": process.env.APP_NAME || "PSNI-Backend",
        },
      }
    );

    const embedding = response.data?.data?.[0]?.embedding as number[] | undefined;
    if (!embedding || !embedding.length) {
      throw new Error("Empty embedding returned from OpenRouter");
    }

    return embedding;
  } catch (error: any) {
    console.error("Error generating embedding:", error.response?.data ?? error);
    throw new Error("Failed to generate embedding");
  }
};
