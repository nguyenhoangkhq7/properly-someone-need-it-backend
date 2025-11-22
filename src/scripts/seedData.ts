// scripts/seed.ts
import mongoose from "mongoose";
import {
  User,
  Item,
  Order,
  ChatRoom,
  Message,
  Review,
} from "../models/index.js"; // <-- điều chỉnh đường dẫn nếu cần

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
    // Xóa dữ liệu cũ
    await Promise.all([
      User.deleteMany({}),
      Item.deleteMany({}),
      Order.deleteMany({}),
      ChatRoom.deleteMany({}),
      Message.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log("Cleared old data");

    // ==================== 1. TẠO 5 USER ====================
    const users = await User.insertMany([
      {
        fullName: "Nguyễn Văn An",
        phone: "+84912345678",
        avatar: "https://i.pravatar.cc/150?img=1",
        address: {
          city: "Hà Nội",
          district: "Cầu Giấy",
          location: { type: "Point", coordinates: [105.7924, 21.0305] },
        },
        rating: 5.0,
        reviewCount: 0,
        successfulTrades: 0,
        trustScore: 100,
        fcmTokens: ["fake-fcm-1"],
      },
      {
        fullName: "Trần Thị Bé",
        phone: "+84987654321",
        avatar: "https://i.pravatar.cc/150?img=2",
        address: {
          city: "TP Hồ Chí Minh",
          district: "Quận 1",
          location: { type: "Point", coordinates: [106.6999, 10.7754] },
        },
        rating: 4.9,
        reviewCount: 0,
        successfulTrades: 0,
        trustScore: 98,
        fcmTokens: ["fake-fcm-2"],
      },
      {
        fullName: "Lê Văn Cường",
        phone: "+84911223344",
        avatar: "https://i.pravatar.cc/150?img=3",
        address: {
          city: "Đà Nẵng",
          district: "Hải Châu",
          location: { type: "Point", coordinates: [108.2097, 16.0471] },
        },
        rating: 4.8,
        reviewCount: 0,
        successfulTrades: 0,
        trustScore: 95,
        fcmTokens: ["fake-fcm-3"],
      },
      {
        fullName: "Phạm Minh Duy",
        phone: "+84944556677",
        avatar: "https://i.pravatar.cc/150?img=5",
        address: {
          city: "Hà Nội",
          district: "Hoàn Kiếm",
          location: { type: "Point", coordinates: [105.8544, 21.0285] },
        },
        rating: 5.0,
        reviewCount: 0,
        successfulTrades: 0,
        trustScore: 100,
        fcmTokens: ["fake-fcm-4"],
      },
      {
        fullName: "Hoàng Thị Em",
        phone: "+84999888777",
        avatar: "https://i.pravatar.cc/150?img=4",
        address: {
          city: "TP Hồ Chí Minh",
          district: "Bình Thạnh",
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

    // ==================== 2. TẠO 25 ITEM ====================
    const items = await Item.insertMany([
      // User 0 – An (5 món)
      {
        sellerId: users[0]._id,
        title: "iPhone 13 Pro 256GB",
        description: "iPhone 13 Pro 256GB, đẹp 99%, phụ kiện cơ bản.",
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
        description: "MacBook Air M1, pin tốt, máy mượt, không xước lớn.",
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
        description: "Apple Watch S7, dây zin, ít trầy, pin ổn.",
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
        description: "AirPods Pro 2, chống ồn tốt, kèm hộp sạc.",
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
        description: "S22 Ultra 256GB, màn đẹp, kèm ốp.",
        category: "PHONE",
        condition: "GOOD",
        price: 13500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=5"],
        location: { type: "Point", coordinates: [105.7924, 21.0305] },
        status: "ACTIVE",
      },

      // User 1 – Bé (5 món)
      {
        sellerId: users[1]._id,
        title: "iPhone 14 Pro Max 128GB",
        description: "iPhone 14 Pro Max 128GB, máy đẹp, hàng chính hãng.",
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
        description: "Dell XPS 13, màn đẹp, kèm sạc, máy mỏng nhẹ.",
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
        description: "iPad Air 5 256GB, bút mượt, pin ổn.",
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
        description: "Tai nghe Sony XM5, chống ồn siêu tốt, hộp đầy đủ.",
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
        description: "Galaxy Watch 5 Pro, dây zin, pin ổn định.",
        category: "WATCH",
        condition: "LIKE_NEW",
        price: 7500000,
        isNegotiable: false,
        images: ["https://picsum.photos/400/400?random=10"],
        location: { type: "Point", coordinates: [106.6999, 10.7754] },
        status: "ACTIVE",
      },

      // User 2 – Cường (5 món)
      {
        sellerId: users[2]._id,
        title: "iPhone 12 Pro 128GB",
        description: "iPhone 12 Pro 128GB, xách tay, pin còn tốt.",
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
        description: "Surface Laptop 4, màn cảm ứng, vỏ nhôm đẹp.",
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
        description: "Galaxy Tab S8, màn 120Hz, bút đầy đủ.",
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
        description: "Bose QC45, chống ồn tốt, đệm tai êm.",
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
        description: "Garmin Fenix 6, dành cho thể thao, kính còn đẹp.",
        category: "WATCH",
        condition: "GOOD",
        price: 9500000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=15"],
        location: { type: "Point", coordinates: [108.2097, 16.0471] },
        status: "ACTIVE",
      },

      // User 3 – Duy (5 món)
      {
        sellerId: users[3]._id,
        title: "Xiaomi 13 Pro",
        description: "Xiaomi 13 Pro, màn đẹp, sạc nhanh 120W.",
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
        description: "ThinkPad X1 Gen 10, bàn phím tốt, pin khá.",
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
        description: "iPad Pro 11 M1, màn 120Hz, FaceID mượt.",
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
        description: "Jabra Elite 85t, chống ồn, mic rõ.",
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
        description: "Apple Watch SE 44mm, chạy mượt, dây mới.",
        category: "WATCH",
        condition: "FAIR",
        price: 4800000,
        isNegotiable: true,
        images: ["https://picsum.photos/400/400?random=20"],
        location: { type: "Point", coordinates: [105.8544, 21.0285] },
        status: "SOLD",
      },

      // User 4 – Em (5 món)
      {
        sellerId: users[4]._id,
        title: "Oppo Find X5 Pro",
        description: "Oppo Find X5 Pro, camera đẹp, sạc nhanh.",
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
        description: "ROG G14, GPU rời ấn tượng, máy gọn.",
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
        description: "Z Fold 4, màn gập ổn, phụ kiện cơ bản.",
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
        description: "Anker Liberty 3 Pro, bass mạnh, hộp đầy đủ.",
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
        description: "Fitbit Sense, đo sức khỏe ổn, dây đeo êm.",
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

    // ==================== 3. TẠO 5 ORDER HOÀN THÀNH + REVIEW ====================
    const soldItemIndices = [2, 8, 12, 19, 22]; // các item đã để status SOLD ở trên
    const completedOrders = await Order.insertMany(
      soldItemIndices.map((idx, i) => ({
        buyerId: users[(i + 1) % 5]._id, // người mua luân phiên
        sellerId: items[idx].sellerId,
        itemId: items[idx]._id,
        priceAtPurchase: items[idx].price,
        finalPrice: items[idx].price * 0.95, // giảm nhẹ để có finalPrice
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
          "Sản phẩm đẹp như mới, anh shipper thân thiện, giao dịch rất ok!",
        images: ["https://picsum.photos/600/600?random=100"],
      },
      {
        orderId: completedOrders[1]._id,
        reviewerId: users[2]._id,
        sellerId: items[8].sellerId,
        itemId: items[8]._id,
        rating: 5,
        comment:
          "Tai nghe còn rất mới, chống ồn tuyệt vời. Sẽ mua tiếp của shop!",
      },
      {
        orderId: completedOrders[2]._id,
        reviewerId: users[3]._id,
        sellerId: items[12].sellerId,
        itemId: items[12]._id,
        rating: 4,
        comment: "Máy đẹp, pin ổn, chỉ tiếc hộp không còn đầy đủ phụ kiện.",
      },
      {
        orderId: completedOrders[3]._id,
        reviewerId: users[4]._id,
        sellerId: items[19].sellerId,
        itemId: items[19]._id,
        rating: 5,
        comment: "Giao dịch nhanh gọn, hàng đúng mô tả 100%",
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
        comment: "Rất hài lòng, chị chủ nhiệt tình, hàng chất lượng cao.",
      },
    ]);

    console.log("5 completed orders + 5 reviews created");

    // ==================== 4. MẪU CHATROOM + MESSAGES (tuỳ chọn) ====================
    const sampleChat = await ChatRoom.create({
      buyerId: users[0]._id,
      sellerId: users[1]._id,
      itemId: items[5]._id,
      unreadCount: { buyer: 0, seller: 3 },
      lastMessage: "Chốt đơn nhé anh!",
      lastMessageAt: new Date(),
    });

    await Message.insertMany([
      {
        chatRoomId: sampleChat._id,
        senderId: users[0]._id,
        content: "Chào chị, iPhone 14 Pro Max còn không ạ?",
        messageType: "TEXT",
      },
      {
        chatRoomId: sampleChat._id,
        senderId: users[1]._id,
        content: "Còn em ơi, máy đẹp 99%",
        messageType: "TEXT",
      },
      {
        chatRoomId: sampleChat._id,
        senderId: users[0]._id,
        content: "Chốt đơn nhé anh!",
        messageType: "TEXT",
      },
    ]);

    console.log("Sample chatroom + messages created");

    // ==================== HOÀN TẤT ====================
    console.log("SEED HOÀN TẤT! Tổng cộng:");
    console.log(`- Users   : ${users.length}`);
    console.log(`- Items   : ${items.length}`);
    console.log(`- Orders  : ${completedOrders.length}`);
    console.log(`- Reviews : ${reviews.length}`);
    console.log(`- ChatRoom: 1 (mẫu)`);

    mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
};

seedData();
