import mongoose from "mongoose";
import { connectDB } from "../config/db/index.js";
import { Item } from "../models/Item.js";
import { getEmbedding } from "../services/embeddingService.js";

const run = async () => {
  await connectDB();

  const items = await Item.find({
    $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
  });

  if (!items.length) {
    console.log("No items need embedding.");
    return;
  }

  console.log(`Generating embeddings for ${items.length} items...`);

  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const text = `${item.title}\n${item.description ?? ""}`;
      const embedding = await getEmbedding(text);
      item.embedding = embedding;
      await item.save();
      success += 1;
      console.log(`Updated item ${item._id} with embedding.`);
    } catch (err) {
      failed += 1;
      console.error(`Skip item ${item._id} due to error:`, err?.toString?.() ?? err);
      // tiếp tục item tiếp theo thay vì dừng toàn bộ
    }
  }

  console.log(`Backfill completed. Success: ${success}, Failed: ${failed}`);
};

run()
  .catch((err) => {
    console.error("Backfill error:", err);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
