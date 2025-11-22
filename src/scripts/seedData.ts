// scripts/seed.ts
import mongoose from "mongoose";
import {
  User,
  Item,
  Order,
  ChatRoom,
  Message,
  Review,
} from "../models/index"; // <-- Ä‘iá»u chá»‰nh Ä‘Æ°á»ng dáº«n náº¿u cáº§n

const MONGO_URI = "mongodb://localhost:27017/psni";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const seedData = async () => {
  try {
    // XÃ³a dá»¯ liá»‡u cÅ©
    await Promise.all([
      User.deleteMany({}),
      Item.deleteMany({}),
      Order.deleteMany({}),
      ChatRoom.deleteMany({}),
      Message.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log("Cleared old data");

    // ==================== 1. Táº O 5 USER ====================
    const users = await User.insertMany([
      {
        fullName: "Nguyá»…n VÄƒn An",
        phone: "+84912345678",
        avatar: "https://i.pravatar.cc/150?img=1",
        address: {
          city: "HÃ  Ná»™i",
          district: "Cáº§u Giáº¥y",
          location: { type: "Point", coordinates: [105.7924, 21.0305] },
        },
        rating: 5.0,
        reviewCount: 0,
        successfulTrades: 0,
        trustScore: 100,
        fcmTokens: ["fake-fcm-1"],
      },
      {
        fullName: "Tráº§n Thá»‹ BÃ©",
        phone: "+84987654321",
        avatar: "https://i.pravatar.cc/150?img=2",
        address: {
          city: "TP Há»“ ChÃ­ Minh",
          district: "Quáº­n 1",
          location: { type: "Point", coordinates: [106.6999, 10.7754] },
        },
        rating: 4.9,
        reviewCount: 0,
        successfulTrades: 0,
        trustScore: 98,
        fcmTokens: ["fake-fcm-2"],
      },
      {
        fullName: "LÃª VÄƒn CÆ°á»ng",
        phone: "+84911223344",
        avatar: "https://i.pravatar.cc/150?img=3",
        address: {
          city: "ÄÃ  Náºµng",
          district: "Háº£i ChÃ¢u",
          location: { type: "Point", coordinates: [108.2097, 16.0471] },
        },
        rating: 4.8,
        reviewCount: 0,
        successfulTrades: 0,
        trustScore: 95,
        fcmTokens: ["fake-fcm-3"],
      },
      {
        fullName: "Pháº¡m Minh Duy",
        phone: "+84944556677",
        avatar: "https://i.pravatar.cc/150?img=5",
        address: {
          city: "HÃ  Ná»™i",
          district: "HoÃ n Kiáº¿m",
          location: { type: "Point", coordinates: [105.8544, 21.0285] },
        },
        rating: 5.0,
        reviewCount: 0,
        successfulTrades: 0,
        trustScore: 100,
        fcmTokens: ["fake-fcm-4"],
      },
      {
        fullName: "HoÃ ng Thá»‹ Em",
        phone: "+84999888777",
        avatar: "https://i.pravatar.cc/150?img=4",
        address: {
          city: "TP Há»“ ChÃ­ Minh",
          district: "BÃ¬nh Tháº¡nh",
          location: { type: "Point", coordinates: [106.7153, 10.8025] },
        },
        rating: 4.7,
        reviewCount: 0,
        successfulTrades: 0,
        trustScore: 92,
        fcmTokens: ["fake-fcm-5"],
      },
    ]);

    console.log("5 users created");

    // ==================== 2. Táº O 25 ITEM ====================
    const items = await Item.insertMany([
      // User 0 â€“ An (5 mÃ³n)
      {
        sellerId: users[0]._id,
        title: "iPhone 13 Pro 256GB",
        description: "iPhone 13 Pro 256GB, Ä‘áº¹p 99%, phá»¥ kiá»‡n cÆ¡ báº£n.",
        category: "PHONE",
        condition: "LIKE_NEW",
        price: 16500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=1"],
        location: { type: "Point", coordinates: [105.7924, 21.0305] },
        status: "ACTIVE",
      },
      {
        sellerId: users[0]._id,
        title: "MacBook Air M1",
        description: "MacBook Air M1, pin tá»‘t, mÃ¡y mÆ°á»£t, khÃ´ng xÆ°á»›c lá»›n.",
        category: "LAPTOP",
        condition: "GOOD",
        price: 18500000,
        isNegotiable: false,
        images: ["https://picsum.photos/400/400?random=2"],
        location: { type: "Point", coordinates: [105.7924, 21.0305] },
        status: "ACTIVE",
      },
      {
        sellerId: users[0]._id,
        title: "Apple Watch Series 7 45mm",
        description: "Apple Watch S7, dÃ¢y zin, Ã­t tráº§y, pin á»•n.",
        category: "WATCH",
        condition: "LIKE_NEW",
        price: 8500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=3"],
        location: { type: "Point", coordinates: [105.7924, 21.0305] },
        status: "SOLD",
      },
      {
        sellerId: users[0]._id,
        title: "AirPods Pro 2",
        description: "AirPods Pro 2, chá»‘ng á»“n tá»‘t, kÃ¨m há»™p sáº¡c.",
        category: "HEADPHONE",
        condition: "LIKE_NEW",
        price: 5500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=4"],
        location: { type: "Point", coordinates: [105.7924, 21.0305] },
        status: "ACTIVE",
      },
      {
        sellerId: users[0]._id,
        title: "Samsung S22 Ultra 256GB",
        description: "S22 Ultra 256GB, mÃ n Ä‘áº¹p, kÃ¨m á»‘p.",
        category: "PHONE",
        condition: "GOOD",
        price: 13500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=5"],
        location: { type: "Point", coordinates: [105.7924, 21.0305] },
        status: "ACTIVE",
      },

      // User 1 â€“ BÃ© (5 mÃ³n)
      {
        sellerId: users[1]._id,
        title: "iPhone 14 Pro Max 128GB",
        description: "iPhone 14 Pro Max 128GB, mÃ¡y Ä‘áº¹p, hÃ ng chÃ­nh hÃ£ng.",
        category: "PHONE",
        condition: "LIKE_NEW",
        price: 24500000,
        isNegotiable: false,
        images: ["https://picsum.photos/400/400?random=6"],
        location: { type: "Point", coordinates: [106.6999, 10.7754] },
        status: "ACTIVE",
      },
      {
        sellerId: users[1]._id,
        title: "Dell XPS 13",
        description: "Dell XPS 13, mÃ n Ä‘áº¹p, kÃ¨m sáº¡c, mÃ¡y má»ng nháº¹.",
        category: "LAPTOP",
        condition: "GOOD",
        price: 22500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=7"],
        location: { type: "Point", coordinates: [106.6999, 10.7754] },
        status: "ACTIVE",
      },
      {
        sellerId: users[1]._id,
        title: "iPad Air 5 256GB",
        description: "iPad Air 5 256GB, bÃºt mÆ°á»£t, pin á»•n.",
        category: "TABLET",
        condition: "LIKE_NEW",
        price: 14500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=8"],
        location: { type: "Point", coordinates: [106.6999, 10.7754] },
        status: "ACTIVE",
      },
      {
        sellerId: users[1]._id,
        title: "Sony WH-1000XM5",
        description: "Tai nghe Sony XM5, chá»‘ng á»“n siÃªu tá»‘t, há»™p Ä‘áº§y Ä‘á»§.",
        category: "HEADPHONE",
        condition: "GOOD",
        price: 6800000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=9"],
        location: { type: "Point", coordinates: [106.6999, 10.7754] },
        status: "SOLD",
      },
      {
        sellerId: users[1]._id,
        title: "Galaxy Watch 5 Pro",
        description: "Galaxy Watch 5 Pro, dÃ¢y zin, pin á»•n Ä‘á»‹nh.",
        category: "WATCH",
        condition: "LIKE_NEW",
        price: 7500000,
        isNegotiable: false,
        images: ["https://picsum.photos/400/400?random=10"],
        location: { type: "Point", coordinates: [106.6999, 10.7754] },
        status: "ACTIVE",
      },

      // User 2 â€“ CÆ°á»ng (5 mÃ³n)
      {
        sellerId: users[2]._id,
        title: "iPhone 12 Pro 128GB",
        description: "iPhone 12 Pro 128GB, xÃ¡ch tay, pin cÃ²n tá»‘t.",
        category: "PHONE",
        condition: "GOOD",
        price: 10500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=11"],
        location: { type: "Point", coordinates: [108.2097, 16.0471] },
        status: "ACTIVE",
      },
      {
        sellerId: users[2]._id,
        title: "Surface Laptop 4",
        description: "Surface Laptop 4, mÃ n cáº£m á»©ng, vá» nhÃ´m Ä‘áº¹p.",
        category: "LAPTOP",
        condition: "FAIR",
        price: 13500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=12"],
        location: { type: "Point", coordinates: [108.2097, 16.0471] },
        status: "ACTIVE",
      },
      {
        sellerId: users[2]._id,
        title: "Galaxy Tab S8",
        description: "Galaxy Tab S8, mÃ n 120Hz, bÃºt Ä‘áº§y Ä‘á»§.",
        category: "TABLET",
        condition: "LIKE_NEW",
        price: 12500000,
        isNegotiable: false,
        images: ["https://picsum.photos/400/400?random=13"],
        location: { type: "Point", coordinates: [108.2097, 16.0471] },
        status: "SOLD",
      },
      {
        sellerId: users[2]._id,
        title: "Bose QC45",
        description: "Bose QC45, chá»‘ng á»“n tá»‘t, Ä‘á»‡m tai Ãªm.",
        category: "HEADPHONE",
        condition: "GOOD",
        price: 5800000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=14"],
        location: { type: "Point", coordinates: [108.2097, 16.0471] },
        status: "ACTIVE",
      },
      {
        sellerId: users[2]._id,
        title: "Garmin Fenix 6",
        description: "Garmin Fenix 6, dÃ nh cho thá»ƒ thao, kÃ­nh cÃ²n Ä‘áº¹p.",
        category: "WATCH",
        condition: "GOOD",
        price: 9500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=15"],
        location: { type: "Point", coordinates: [108.2097, 16.0471] },
        status: "ACTIVE",
      },

      // User 3 â€“ Duy (5 mÃ³n)
      {
        sellerId: users[3]._id,
        title: "Xiaomi 13 Pro",
        description: "Xiaomi 13 Pro, mÃ n Ä‘áº¹p, sáº¡c nhanh 120W.",
        category: "PHONE",
        condition: "LIKE_NEW",
        price: 15500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=16"],
        location: { type: "Point", coordinates: [105.8544, 21.0285] },
        status: "ACTIVE",
      },
      {
        sellerId: users[3]._id,
        title: "ThinkPad X1 Carbon G10",
        description: "ThinkPad X1 Gen 10, bÃ n phÃ­m tá»‘t, pin khÃ¡.",
        category: "LAPTOP",
        condition: "GOOD",
        price: 26500000,
        isNegotiable: false,
        images: ["https://picsum.photos/400/400?random=17"],
        location: { type: "Point", coordinates: [105.8544, 21.0285] },
        status: "ACTIVE",
      },
      {
        sellerId: users[3]._id,
        title: "iPad Pro 11 M1",
        description: "iPad Pro 11 M1, mÃ n 120Hz, FaceID mÆ°á»£t.",
        category: "TABLET",
        condition: "LIKE_NEW",
        price: 16500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=18"],
        location: { type: "Point", coordinates: [105.8544, 21.0285] },
        status: "ACTIVE",
      },
      {
        sellerId: users[3]._id,
        title: "Jabra Elite 85t",
        description: "Jabra Elite 85t, chá»‘ng á»“n, mic rÃµ.",
        category: "HEADPHONE",
        condition: "GOOD",
        price: 3800000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=19"],
        location: { type: "Point", coordinates: [105.8544, 21.0285] },
        status: "ACTIVE",
      },
      {
        sellerId: users[3]._id,
        title: "Apple Watch SE 44mm",
        description: "Apple Watch SE 44mm, cháº¡y mÆ°á»£t, dÃ¢y má»›i.",
        category: "WATCH",
        condition: "FAIR",
        price: 4800000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=20"],
        location: { type: "Point", coordinates: [105.8544, 21.0285] },
        status: "SOLD",
      },

      // User 4 â€“ Em (5 mÃ³n)
      {
        sellerId: users[4]._id,
        title: "Oppo Find X5 Pro",
        description: "Oppo Find X5 Pro, camera Ä‘áº¹p, sáº¡c nhanh.",
        category: "PHONE",
        condition: "GOOD",
        price: 12500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=21"],
        location: { type: "Point", coordinates: [106.7153, 10.8025] },
        status: "ACTIVE",
      },
      {
        sellerId: users[4]._id,
        title: "Asus ROG Zephyrus G14",
        description: "ROG G14, GPU rá»i áº¥n tÆ°á»£ng, mÃ¡y gá»n.",
        category: "LAPTOP",
        condition: "LIKE_NEW",
        price: 29500000,
        isNegotiable: false,
        images: ["https://picsum.photos/400/400?random=22"],
        location: { type: "Point", coordinates: [106.7153, 10.8025] },
        status: "ACTIVE",
      },
      {
        sellerId: users[4]._id,
        title: "Samsung Galaxy Z Fold 4",
        description: "Z Fold 4, mÃ n gáº­p á»•n, phá»¥ kiá»‡n cÆ¡ báº£n.",
        category: "PHONE",
        condition: "GOOD",
        price: 21500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=23"],
        location: { type: "Point", coordinates: [106.7153, 10.8025] },
        status: "SOLD",
      },
      {
        sellerId: users[4]._id,
        title: "Anker Soundcore Liberty 3 Pro",
        description: "Anker Liberty 3 Pro, bass máº¡nh, há»™p Ä‘áº§y Ä‘á»§.",
        category: "HEADPHONE",
        condition: "LIKE_NEW",
        price: 2500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=24"],
        location: { type: "Point", coordinates: [106.7153, 10.8025] },
        status: "ACTIVE",
      },
      {
        sellerId: users[4]._id,
        title: "Fitbit Sense",
        description: "Fitbit Sense, Ä‘o sá»©c khá»e á»•n, dÃ¢y Ä‘eo Ãªm.",
        category: "WATCH",
        condition: "GOOD",
        price: 4200000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=25"],
        location: { type: "Point", coordinates: [106.7153, 10.8025] },
        status: "ACTIVE",
      },
    ]);

    console.log("25 items created");

    // ==================== 3. Táº O 5 ORDER HOÃ€N THÃ€NH + REVIEW ====================
    const soldItemIndices = [2, 8, 12, 19, 22]; // cÃ¡c item Ä‘Ã£ Ä‘á»ƒ status SOLD á»Ÿ trÃªn
    const completedOrders = await Order.insertMany(
      soldItemIndices.map((idx, i) => ({
        buyerId: users[(i + 1) % 5]._id, // ngÆ°á»i mua luÃ¢n phiÃªn
        sellerId: items[idx].sellerId,
        itemId: items[idx]._id,
        priceAtPurchase: items[idx].price,
        finalPrice: items[idx].price * 0.95, // giáº£m nháº¹ Ä‘á»ƒ cÃ³ finalPrice
        status: "COMPLETED",
      }))
    );

    const reviews = await Review.insertMany([
      {
        orderId: completedOrders[0]._id,
        reviewerId: users[1]._id,
        sellerId: items[2].sellerId,
        itemId: items[2]._id,
        rating: 5,
        comment:
          "Sáº£n pháº©m Ä‘áº¹p nhÆ° má»›i, anh shipper thÃ¢n thiá»‡n, giao dá»‹ch ráº¥t ok!",
        images: ["https://picsum.photos/600/600?random=100"],
      },
      {
        orderId: completedOrders[1]._id,
        reviewerId: users[2]._id,
        sellerId: items[8].sellerId,
        itemId: items[8]._id,
        rating: 5,
        comment:
          "Tai nghe cÃ²n ráº¥t má»›i, chá»‘ng á»“n tuyá»‡t vá»i. Sáº½ mua tiáº¿p cá»§a shop!",
      },
      {
        orderId: completedOrders[2]._id,
        reviewerId: users[3]._id,
        sellerId: items[12].sellerId,
        itemId: items[12]._id,
        rating: 4,
        comment: "MÃ¡y Ä‘áº¹p, pin á»•n, chá»‰ tiáº¿c há»™p khÃ´ng cÃ²n Ä‘áº§y Ä‘á»§ phá»¥ kiá»‡n.",
      },
      {
        orderId: completedOrders[3]._id,
        reviewerId: users[4]._id,
        sellerId: items[19].sellerId,
        itemId: items[19]._id,
        rating: 5,
        comment: "Giao dá»‹ch nhanh gá»n, hÃ ng Ä‘Ãºng mÃ´ táº£ 100%",
        images: [
          "https://picsum.photos/600/600?random=101",
          "https://picsum.photos/600/600?random=102",
        ],
      },
      {
        orderId: completedOrders[4]._id,
        reviewerId: users[0]._id,
        sellerId: items[22].sellerId,
        itemId: items[22]._id,
        rating: 5,
        comment: "Ráº¥t hÃ i lÃ²ng, chá»‹ chá»§ nhiá»‡t tÃ¬nh, hÃ ng cháº¥t lÆ°á»£ng cao.",
      },
    ]);

    console.log("5 completed orders + 5 reviews created");

    // ==================== 4. MáºªU CHATROOM + MESSAGES (tuá»³ chá»n) ====================
    const sampleChat = await ChatRoom.create({
      buyerId: users[0]._id,
      sellerId: users[1]._id,
      itemId: items[5]._id,
      unreadCount: { buyer: 0, seller: 3 },
      lastMessage: "Chá»‘t Ä‘Æ¡n nhÃ© anh!",
      lastMessageAt: new Date(),
    });

    await Message.insertMany([
      {
        chatRoomId: sampleChat._id,
        senderId: users[0]._id,
        content: "ChÃ o chá»‹, iPhone 14 Pro Max cÃ²n khÃ´ng áº¡?",
        messageType: "TEXT",
      },
      {
        chatRoomId: sampleChat._id,
        senderId: users[1]._id,
        content: "CÃ²n em Æ¡i, mÃ¡y Ä‘áº¹p 99%",
        messageType: "TEXT",
      },
      {
        chatRoomId: sampleChat._id,
        senderId: users[0]._id,
        content: "Chá»‘t Ä‘Æ¡n nhÃ© anh!",
        messageType: "TEXT",
      },
    ]);

    console.log("Sample chatroom + messages created");

    // ==================== HOÃ€N Táº¤T ====================
    console.log("SEED HOÃ€N Táº¤T! Tá»•ng cá»™ng:");
    console.log(`- Users   : ${users.length}`);
    console.log(`- Items   : ${items.length}`);
    console.log(`- Orders  : ${completedOrders.length}`);
    console.log(`- Reviews : ${reviews.length}`);
    console.log(`- ChatRoom: 1 (máº«u)`);

    mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
};

seedData();

