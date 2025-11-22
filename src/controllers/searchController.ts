import type { Request, Response } from "express";
import { Item, type IItem } from "../models/Item.js";
import { SearchHistory } from "../models/SearchHistory.js";
import { Types } from "mongoose";
import { getEmbedding } from "../services/embeddingService.js";

type ItemCategory = IItem["category"];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const CATEGORY_KEYWORDS: Record<ItemCategory, string[]> = {
  PHONE: [
    "dien thoai",
    "smartphone",
    "iphone",
    "android",
    "samsung",
    "oppo",
    "xiaomi",
    "realme",
    "vivo",
    "nokia",
    "pixel",
    "oneplus",
  ],
  LAPTOP: [
    "laptop",
    "macbook",
    "notebook",
    "thinkpad",
    "msi",
    "asus",
    "acer",
    "lenovo legion",
    "ideapad",
    "surface laptop",
  ],
  TABLET: [
    "tablet",
    "ipad",
    "galaxy tab",
    "lenovo tab",
    "surface pro",
    "xiaomi pad",
  ],
  WATCH: [
    "dong ho",
    "apple watch",
    "galaxy watch",
    "smartwatch",
    "watch gt",
    "mi band",
  ],
  HEADPHONE: [
    "tai nghe",
    "headphone",
    "earbud",
    "earbuds",
    "airpods",
    "beats",
    "sony wf",
    "sony wh",
    "gaming headset",
  ],
  ACCESSORY: [
    "phu kien",
    "op lung",
    "op iphone",
    "bao da",
    "cuong luc",
    "mieng dan",
    "sac",
    "cap",
    "cu sac",
    "adapter",
    "sac du phong",
    "case",
    "dock",
    "the nho",
    "sim",
  ],
  OTHER: [],
};

const detectStrongCategory = (normalizedQuery: string): ItemCategory | null => {
  const hits = new Set<ItemCategory>();
  (
    Object.entries(CATEGORY_KEYWORDS) as Array<[ItemCategory, string[]]>
  ).forEach(([category, keywords]) => {
    if (keywords.some((kw) => normalizedQuery.includes(kw))) {
      hits.add(category);
    }
  });
  return hits.size === 1 ? Array.from(hits)[0] : null;
};

const computeKeywordBonus = (
  normalizedQuery: string,
  normalizedTokens: string[],
  normalizedText: string
) => {
  const tokenHits = normalizedTokens.filter(
    (token) => token.length > 2 && normalizedText.includes(token)
  ).length;
  const tokenBonus = tokenHits ? Math.min(0.15, tokenHits * 0.03) : 0;
  const phraseBonus =
    normalizedQuery.length > 6 && normalizedText.includes(normalizedQuery)
      ? 0.05
      : 0;
  return tokenBonus + phraseBonus;
};

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
    const EMBEDDING_MAX_RETRY = 3;

    if (!rawQuery) {
      return res.status(400).json({
        success: false,
        message: "Thiu tham s q (query string).",
      });
    }

    const normalizedQuery = normalizeText(rawQuery);
    const normalizedTokens = normalizedQuery.split(" ").filter(Boolean);
    const strongCategory = detectStrongCategory(normalizedQuery);
    const MIN_SIMILARITY = strongCategory ? 0.3 : 0.4; // tighten when query is ambiguous

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

    const itemFilter: Record<string, unknown> = {
      status: "ACTIVE",
      embedding: { $exists: true, $ne: [] },
    };

    if (strongCategory) {
      itemFilter.category = strongCategory; // avoid cross-category matches (e.g., phone vs tablet)
    }

    const rawItems = await Item.find(itemFilter).lean().exec();
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
        const normalizedTextBlob = normalizeText(
          `${item.title} ${item.description} ${item.brand ?? ""} ${
            item.modelName ?? ""
          } ${item.category} ${item.subcategory ?? ""}`
        );
        const keywordBonus = computeKeywordBonus(
          normalizedQuery,
          normalizedTokens,
          normalizedTextBlob
        );
        const categoryBoost =
          strongCategory && item.category === strongCategory ? 0.15 : 0;
        return {
          item,
          score: baseScore + keywordBonus + categoryBoost,
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
