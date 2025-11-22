import type { Request, Response } from "express";
import { Item, type IItem } from "../models/Item.js";
import { SearchHistory } from "../models/SearchHistory.js";
import { Types } from "mongoose";
import { getEmbedding } from "../services/embeddingService.js";

const cosineSimilarity = (a: number[], b: number[]) => {
  if (!a.length || !b.length || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const semanticSearch = async (req: Request, res: Response) => {
  try {
    const rawQuery = (req.query.q ?? req.query.query ?? "").toString().trim();
    const userId = (req.query.userId ?? req.query.u ?? "").toString().trim();
    const limit = Number(req.query.limit ?? 20);
    const MIN_SIMILARITY = 0.35; // filter out weak matches
    const EMBEDDING_MAX_RETRY = 3;

    if (!rawQuery) {
      return res.status(400).json({
        success: false,
        message: "Thiu tham s q (query string).",
      });
    }

    let queryEmbedding: number[] | null = null;
    let lastEmbeddingError: unknown;
    for (let attempt = 1; attempt <= EMBEDDING_MAX_RETRY; attempt += 1) {
      try {
        queryEmbedding = await getEmbedding(rawQuery);
        if (queryEmbedding?.length) break;
      } catch (err) {
        lastEmbeddingError = err;
      }
    }

    if (!queryEmbedding || !queryEmbedding.length) {
      console.error(
        "Failed to generate embedding after retries:",
        lastEmbeddingError
      );
      return res.status(502).json({
        success: false,
        message: "Failed to generate query embedding. Please try again.",
      });
    }

    const rawItems = await Item.find({
      status: "ACTIVE",
      embedding: { $exists: true, $ne: [] },
    })
      .lean()
      .exec();
    const items = rawItems as unknown as Array<
      IItem & { embedding?: number[] }
    >;

    if (!items.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Cha c d liu embedding cho Item. Hy backfill trbc.",
      });
    }

    if (userId && Types.ObjectId.isValid(userId)) {
      try {
        const doc = await SearchHistory.create({
          userId: new Types.ObjectId(userId),
          query: rawQuery,
        });
        const idStr = String((doc as any)?._id ?? "");
        console.log("[SearchHistory] saved", {
          _id: idStr,
          userId,
          query: rawQuery,
        });
      } catch (err) {
        console.error("Log search history error:", err);
      }
    } else {
      console.log("[SearchHistory] skip log, invalid or missing userId", {
        userId,
      });
    }

    const scored = items
      .map((item) => {
        const baseScore = cosineSimilarity(
          queryEmbedding,
          item.embedding ?? []
        );
        const textBlob = `${item.title} ${item.description}`.toLowerCase();
        const kw = rawQuery.toLowerCase();
        const keywordBonus = textBlob.includes(kw) ? 0.1 : 0; // boost exact substring match
        return {
          item,
          score: baseScore + keywordBonus,
        };
      })
      .filter((s) => s.score >= MIN_SIMILARITY)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return res.json({
      success: true,
      query: rawQuery,
      count: scored.length,
      data: scored.map(({ item, score }) => ({
        ...item,
        similarity: score,
      })),
    });
  } catch (err) {
    console.error("Semantic search error:", err);
    return res.status(500).json({
      success: false,
      message: "L-i server khi thc hifn semantic search",
    });
  }
};
