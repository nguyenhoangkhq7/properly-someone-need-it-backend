import type { Request, Response } from "express";
import { Item } from "../models/Item";
import { SearchHistory } from "../models/SearchHistory";
import { Types } from "mongoose";
import { getEmbedding } from "../services/embeddingService";

// --- TYPES ---
type ItemCategory =
  | "PHONE"
  | "LAPTOP"
  | "TABLET"
  | "WATCH"
  | "HEADPHONE"
  | "ACCESSORY"
  | "OTHER";

// --- CONFIGURATION ---
const CONFIG = {
  MIN_SIMILARITY: 0.14, // Ngưỡng điểm hybrid tối thiểu để chấp nhận (nới lỏng mạnh)
  WEIGHT_VECTOR: 0.5, // Trọng số ngữ nghĩa (50%)
  WEIGHT_KEYWORD: 0.5, // Trọng số từ khóa (50%)
  BONUS_TITLE_MATCH: 0.2, // Điểm thưởng nếu gần như khớp Title
  BONUS_CATEGORY: 0.15, // Điểm thưởng nếu đúng Category
  PENALTY_WRONG_CAT: 0.05, // Trừ điểm nếu sai Category (giảm phạt tối thiểu)
};

// --- HELPERS ---

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Chuẩn hóa text dùng cho search / scoring (gộp các field quan trọng)
const buildSearchText = (
  title: string,
  brand?: string,
  modelName?: string,
  category?: string,
  description?: string
) =>
  normalizeText(
    `${title || ""} ${brand || ""} ${modelName || ""} ${category || ""} ${
      description || ""
    }`
  );

// Bộ từ khóa định nghĩa
const CATEGORY_KEYWORDS: Record<ItemCategory, string[]> = {
  // Ưu tiên check phụ kiện trước để tránh nhầm "ốp iphone" thành "điện thoại"
  ACCESSORY: [
    "phu kien",
    "op lung",
    "bao da",
    "cuong luc",
    "mieng dan",
    "sac du phong",
    "adapter",
    "cu sac",
    "cap sac",
    "the nho",
    "usb",
    "chuot",
    "ban phim",
    "lot chuot",
    "sim",
    "tripod",
    "gay chup anh",
  ],
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
    "pixel",
    "vna",
    "quoc te",
    "lock",
    "5g",
    "snapdragon",
    "ios",
  ],
  LAPTOP: [
    "laptop",
    "macbook",
    "notebook",
    "thinkpad",
    "msi",
    "asus",
    "acer",
    "dell",
    "hp",
    "surface",
    "gaming",
    "do hoa",
    "code",
    "lap trinh",
  ],
  TABLET: [
    "tablet",
    "ipad",
    "galaxy tab",
    "may tinh bang",
    "kindle",
    "doc sach",
  ],
  WATCH: [
    "dong ho",
    "apple watch",
    "smartwatch",
    "garmin",
    "watch",
    "miband",
    "deo tay",
  ],
  HEADPHONE: [
    "tai nghe",
    "headphone",
    "earbud",
    "airpods",
    "galaxy buds",
    "sony wf",
    "sony wh",
    "loa",
    "speaker",
    "bluetooth",
    "am thanh",
    "chong on",
    "anc",
  ],
  OTHER: [
    "may anh",
    "camera",
    "dslr",
    "mirrorless",
    "lens",
    "ong kinh",
    "console",
    "game",
    "playstation",
    "xbox",
    "nintendo",
    "switch",
    "tv",
    "man hinh",
    "router",
    "wifi",
    "smarthome",
    "robot",
  ],
};

// Hàm đoán ý định (đa category) -> cho phép 1 query map ra nhiều loại
const detectSearchIntentMulti = (normalizedQuery: string): ItemCategory[] => {
  const scores: Record<ItemCategory, number> = {
    PHONE: 0,
    LAPTOP: 0,
    TABLET: 0,
    WATCH: 0,
    HEADPHONE: 0,
    ACCESSORY: 0,
    OTHER: 0,
  };

  // Ưu tiên ACCESSORY (nếu có từ khóa phụ kiện thì cộng điểm mạnh hơn)
  for (const kw of CATEGORY_KEYWORDS.ACCESSORY) {
    if (normalizedQuery.includes(kw)) {
      scores.ACCESSORY += kw.split(" ").length * 2;
    }
  }

  // Tính điểm cho các category còn lại
  (Object.entries(CATEGORY_KEYWORDS) as [ItemCategory, string[]][])
    .filter(([cat]) => cat !== "ACCESSORY")
    .forEach(([cat, keywords]) => {
      for (const kw of keywords) {
        if (normalizedQuery.includes(kw)) {
          scores[cat] += kw.split(" ").length; // từ dài được cộng điểm nhiều hơn
        }
      }
    });

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore <= 0) return [];

  // Lấy tất cả category có score >= 70% maxScore
  return (Object.keys(scores) as ItemCategory[]).filter(
    (c) => scores[c] >= maxScore * 0.7
  );
};

// Tính Cosine Similarity (có bảo vệ chia cho 0 + clamp 0..1)
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (!normA || !normB) return 0;
  const raw = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, raw));
};

// Tính percentile để cắt ngưỡng động dựa trên phân phối điểm
const computePercentile = (values: number[], percentile: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const weight = idx - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
};

// Tính điểm khớp từ khóa (weighted)
const computeKeywordScore = (
  queryTokens: string[],
  itemText: string
): number => {
  if (!queryTokens.length) return 0;

  let totalWeight = 0;
  let matchedWeight = 0;

  for (const token of queryTokens) {
    const weight = token.length >= 4 ? 1.5 : 1; // từ dài quan trọng hơn
    totalWeight += weight;
    if (itemText.includes(token)) matchedWeight += weight;
  }

  return totalWeight ? matchedWeight / totalWeight : 0; // 0 -> 1
};

// --- MAIN CONTROLLER ---

export const semanticSearch = async (req: Request, res: Response) => {
  try {
    // 1. Input Handling
    const rawQuery = (req.query.q ?? req.query.query ?? "").toString().trim();
    const userId = req.userId ?? "";
    const limit = Math.min(Number(req.query.limit ?? 20), 50);

    if (!rawQuery) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập từ khóa." });
    }

    // 2. Pre-processing & Intent Detection
    const normalizedQuery = normalizeText(rawQuery);
    const queryTokens = normalizedQuery.split(" ").filter((t) => t.length > 1);
    const detectedCategories = detectSearchIntentMulti(normalizedQuery);

    // 3. Generate Embedding
    let queryEmbedding: number[];
    try {
      // Dùng rawQuery để giữ tương thích với embedding dữ liệu đã lưu
      queryEmbedding = await getEmbedding(rawQuery);
    } catch (e) {
      console.error("Embedding error:", e);
      return res
        .status(503)
        .json({ success: false, message: "Lỗi AI Service." });
    }

    // 4. Build DB Query (Hard Filtering)
    const filter: any = {
      status: "ACTIVE",
      embedding: { $exists: true, $ne: [] },
    };

    let categoriesForFilter: ItemCategory[] = [...detectedCategories];

    // Logic mở rộng: nếu tìm "chup anh" -> PHONE + OTHER
    if (
      categoriesForFilter.includes("PHONE") &&
      normalizedQuery.includes("chup anh") &&
      !categoriesForFilter.includes("OTHER")
    ) {
      categoriesForFilter.push("OTHER");
    }

    if (categoriesForFilter.length) {
      filter.category = { $in: categoriesForFilter };
    }

    // 5. Fetch Candidates (Projection Optimization)
    const candidates = await Item.find(filter)
      .select(
        "_id title description category brand modelName price images embedding"
      )
      .lean()
      .exec();

    if (!candidates.length) {
      return res.json({
        success: true,
        data: [],
        message: "Không tìm thấy sản phẩm phù hợp.",
        meta: {
          query: rawQuery,
          detectedCategories,
          strategy: "no_candidate",
        },
      });
    }

    // 6. Scoring & Ranking (Hybrid Search Logic)
    type ScoredItem = {
      _id: any;
      title: string;
      description?: string;
      category: ItemCategory;
      brand?: string;
      modelName?: string;
      price?: number;
      images?: any;
      similarity: number;
      keywordScore: number;
      score: number;
    };

    const scoredRaw: ScoredItem[] = [];

    for (const rawItem of candidates as any[]) {
      const { embedding, ...rest } = rawItem;

      const itemTextNorm = buildSearchText(
        rest.title,
        rest.brand,
        rest.modelName,
        rest.category,
        rest.description
      );

      // A. Vector Similarity (Semantic)
      const vectorScore = cosineSimilarity(queryEmbedding!, embedding);

      // B. Keyword Matching (Lexical)
      const keywordScore = computeKeywordScore(queryTokens, itemTextNorm);

      // Hard rule: vector rất thấp + keyword rất thấp => bỏ
      if (vectorScore < 0.08 && keywordScore < 0.15) {
        continue;
      }

      // C. Base Score Calculation
      let finalScore =
        vectorScore * CONFIG.WEIGHT_VECTOR +
        keywordScore * CONFIG.WEIGHT_KEYWORD;

      // D. Boosting & Penalties (Fine-tuning)

      // Boost 1: Gần như match nguyên cụm query trong text
      if (itemTextNorm.includes(normalizedQuery)) {
        finalScore += CONFIG.BONUS_TITLE_MATCH;
      }

      // Boost 2: Brand / Model xuất hiện trong query
      if (rest.brand) {
        const brandNorm = normalizeText(rest.brand);
        if (normalizedQuery.includes(brandNorm)) {
          finalScore += 0.08;
        }
      }

      if (rest.modelName) {
        const modelNorm = normalizeText(rest.modelName);
        if (normalizedQuery.includes(modelNorm)) {
          finalScore += 0.12;
        }
      }

      // Boost 3: Category Alignment
      if (detectedCategories.length) {
        if (detectedCategories.includes(rest.category)) {
          finalScore += CONFIG.BONUS_CATEGORY;
        } else if (
          !(detectedCategories.includes("PHONE") && rest.category === "OTHER")
        ) {
          // Nếu không phải case PHONE vs OTHER (camera) thì phạt
          finalScore -= CONFIG.PENALTY_WRONG_CAT;
          if (detectedCategories.length === 1) {
            finalScore -= 0.1;
          }
        }
      }

      // Penalty: vector cao nhưng keyword gần như không khớp => semantic rộng, giảm chút
      if (keywordScore < 0.2 && !itemTextNorm.includes(normalizedQuery)) {
        finalScore *= 0.75;
      }

      scoredRaw.push({
        ...(rest as any),
        category: rest.category as ItemCategory,
        similarity: Number(vectorScore.toFixed(4)),
        keywordScore: Number(keywordScore.toFixed(4)),
        score: Number(finalScore.toFixed(4)),
      });
    }

    if (!scoredRaw.length) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: "Không có kết quả đủ tốt sau khi lọc.",
        meta: {
          query: rawQuery,
          detectedCategories,
          strategy: detectedCategories.length
            ? "filtered_semantic"
            : "pure_semantic",
        },
      });
    }

    // 6b. Dynamic threshold theo phân bố điểm
    scoredRaw.sort((a, b) => b.score - a.score);

    // Lấy tối đa 100 bản ghi để tính ngưỡng động
    const topForStats = scoredRaw.slice(0, 100);
    const avgScore =
      topForStats.reduce((sum, x) => sum + x.score, 0) /
      Math.max(1, topForStats.length);

    const percentile75 = computePercentile(
      topForStats.map((x) => x.score),
      60
    );

    const dynamicThreshold = Math.max(
      CONFIG.MIN_SIMILARITY,
      percentile75 || avgScore * 0.8 // nới lỏng thêm dựa trên phân bố điểm
    );

    const finalItems = scoredRaw
      .filter((x) => x.score >= dynamicThreshold)
      .slice(0, limit);

    // 7. Async Logging (Non-blocking)
    if (userId && Types.ObjectId.isValid(userId)) {
      SearchHistory.create({
        userId: new Types.ObjectId(userId),
        query: rawQuery,
      }).catch((e) => console.error("Log history failed", e.message));
    }

    // 8. Response
    return res.json({
      success: true,
      count: finalItems.length,
      data: finalItems,
      meta: {
        query: rawQuery,
        detectedCategories,
        strategy: detectedCategories.length
          ? "filtered_semantic"
          : "pure_semantic",
        avgScore,
        dynamicThreshold,
      },
    });
  } catch (err) {
    console.error("Search fatal error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server nội bộ." });
  }
};
