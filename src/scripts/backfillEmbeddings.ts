import mongoose from "mongoose";
import { connectDB } from "../config/db/index";
import { Item } from "../models/Item";
import { getEmbedding } from "../services/embeddingService";

const run = async () => {
  await connectDB();

  // 1. Đếm tổng số lượng cần xử lý để hiển thị tiến độ
  const query = {
    $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
  };
  const total = await Item.countDocuments(query);

  if (total === 0) {
    console.log("✅ No items need embedding.");
    return;
  }

  console.log(`🚀 Starting backfill for ${total} items...`);

  // 2. Sử dụng CURSOR để lấy từng item một, tránh tràn RAM
  const cursor = Item.find(query).cursor();

  let success = 0;
  let failed = 0;
  let processed = 0;

  // for await...of giúp duyệt cursor bất đồng bộ
  for await (const item of cursor) {
    processed++;
    try {
      // 3. Làm sạch văn bản input (Clean & Normalize)
      // Loại bỏ null/undefined và khoảng trắng thừa
      const contentParts = [
        item.title,
        item.brand, // Thêm Brand vào để search chính xác hơn (VD: tìm "Apple")
        item.modelName, // Thêm Model (VD: tìm "15 Pro Max")
        item.description,
      ].filter(Boolean); // Lọc bỏ giá trị null/undefined/rỗng

      const textToEmbed = contentParts.join("\n").trim();

      if (!textToEmbed) {
        console.warn(`⚠️ Item ${item._id} has no content to embed.`);
        failed++;
        continue;
      }

      // 4. Gọi OpenAI API
      const embedding = await getEmbedding(textToEmbed);

      // 5. Chỉ update trường embedding (Atomic Update)
      // Dùng updateOne an toàn hơn item.save() trong ngữ cảnh batch job
      await Item.updateOne(
        { _id: item._id },
        { $set: { embedding: embedding } }
      );

      success++;
      // Log tiến độ mỗi 10 items cho đỡ rối màn hình
      if (success % 10 === 0) {
        console.log(
          `⏳ Progress: ${processed}/${total} (${Math.round(
            (processed / total) * 100
          )}%)`
        );
      }
    } catch (err: any) {
      failed++;
      console.error(`❌ Failed item ${item._id}:`, err?.message || err);

      // Optional: Nếu lỗi 429 (Rate Limit) từ OpenAI, nên chờ 1 chút
      if (err?.message?.includes("429")) {
        console.log("zzz Sleeping for 20s due to Rate Limit...");
        await new Promise((r) => setTimeout(r, 20000));
      }
    }
  }

  console.log(`\n🎉 Backfill completed!`);
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
};

run()
  .catch((err) => {
    console.error("Fatal Backfill error:", err);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("🔌 Disconnected DB");
    process.exit(0);
  });
