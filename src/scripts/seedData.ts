// scripts/seed.ts
import mongoose from "mongoose";
import { User, Item, Order, ChatRoom, Message, Review } from "../models/index";

const MONGO_URI = "mongodb://localhost:27017/psni";

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // 1. Clean Data
    await Promise.all([
      User.deleteMany({}),
      Item.deleteMany({}),
      Order.deleteMany({}),
      ChatRoom.deleteMany({}),
      Message.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log("🧹 Cleared old data");

    // 2. Create Users (5 User đại diện 3 miền để test Location)
    const users = await User.insertMany([
      {
        fullName: "Nguyễn Văn An",
        email: "an.nguyen@test.com", // Bổ sung email
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
        isVerified: true, // Thêm tích xanh cho uy tín
      },
      {
        fullName: "Trần Thị Bé",
        email: "be.tran@test.com", // Bổ sung email
        phone: "+84987654321",
        avatar: "https://i.pravatar.cc/150?img=5",
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
        isVerified: true,
      },
      {
        fullName: "Lê Văn Cường",
        email: "cuong.le@test.com", // Bổ sung email
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
        isVerified: false,
      },
      {
        fullName: "Phạm Minh Duy",
        email: "duy.pham@test.com", // Bổ sung email
        phone: "+84944556677",
        avatar: "https://i.pravatar.cc/150?img=13",
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
        isVerified: true,
      },
      {
        fullName: "Hoàng Thị Em",
        email: "em.hoang@test.com", // Bổ sung email
        phone: "+84999888777",
        avatar: "https://i.pravatar.cc/150?img=9",
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
        isVerified: false,
      },
    ]);

    const getUser = (idx: number) => users[idx % 5]._id;
    const getLoc = (idx: number) => users[idx % 5].address.location;

    // 3. Create 30 Semantic-Rich Items
    const itemsData = [
      // --- PHONES (6 items) ---
      {
        sellerId: getUser(0),
        category: "PHONE",
        title: "iPhone 15 Pro Max 256GB Titan Tự Nhiên VNA",
        description:
          "Cần bán iPhone 15 Pro Max bản VNA chính hãng còn bảo hành đến 10/2025. Màu Titan tự nhiên hot nhất năm. Tình trạng: Pin sạc 30 lần còn 100%, ngoại hình đẹp keng như mới bóc hộp, không một vết xước dăm. Máy fullbox cáp zin chưa đụng tới. Phù hợp cho ai tìm máy lướt tiết kiệm vài triệu so với đập hộp. Tặng kèm ốp lưng UAG xịn.",
        price: 28500000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getLoc(0),
        images: [
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500",
        ],
        brand: "Apple",
        modelName: "iPhone 15 Pro Max",
      },
      {
        sellerId: getUser(1),
        category: "PHONE",
        title: "Samsung S23 Ultra 5G - Zoom mặt trăng đỉnh cao",
        description:
          "Lên đời S24 nên pass lại S23 Ultra màu Xanh Botanic. Máy chuyên dùng đi đu concert, zoom 100x cực nét. Bút SPen nhạy, thích hợp cho dân văn phòng note nhanh hoặc vẽ vời. Màn hình Dynamic AMOLED 2X xem phim Netflix cực đã. Viền có xước nhẹ do dùng ốp cứng, màn hình đã dán UV. Full chức năng không lỗi lầm.",
        price: 16200000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getLoc(1),
        images: [
          "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500",
        ],
        brand: "Samsung",
        modelName: "Galaxy S23 Ultra",
      },
      {
        sellerId: getUser(4),
        category: "PHONE",
        title: "Xiaomi Redmi Note 12 Pro cũ giá sinh viên",
        description:
          "Máy mua về chạy Grab được 3 tháng. Pin trâu 5000mAh chạy cả ngày không hết. Màn hình 120Hz lướt TikTok mượt. Bị nứt kính nhẹ ở góc không ảnh hưởng cảm ứng. Bán rẻ cho anh em chạy xe ôm công nghệ hoặc mua về làm máy phụ phát wifi, nghe gọi.",
        price: 2500000,
        condition: "FAIR",
        status: "ACTIVE",
        location: getLoc(4),
        images: [
          "https://images.unsplash.com/photo-1598327105666-5b89351aff23?w=500",
        ],
        brand: "Xiaomi",
        modelName: "Redmi Note 12 Pro",
      },
      {
        sellerId: getUser(0),
        category: "PHONE",
        title: "Google Pixel 7 Pro Quốc tế - Camera chụp đêm bá đạo",
        description:
          "Trải nghiệm xong cần bán Pixel 7 Pro. Thuật toán chụp ảnh của Google quá đỉnh, đặc biệt là chụp đêm Night Sight và xóa phông. Android gốc (Stock Android) siêu mượt, cập nhật sớm nhất. Máy trần, màn hình đẹp không ám ố. Ai thích nhiếp ảnh điện thoại thì con này là trùm phân khúc giá.",
        price: 9800000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getLoc(0),
        images: [
          "https://images.unsplash.com/photo-1610792516820-2bff50c8692c?w=500",
        ],
        brand: "Google",
        modelName: "Pixel 7 Pro",
      },
      {
        sellerId: getUser(2),
        category: "PHONE",
        title: "Oppo Find N2 Flip Tím - Điện thoại gập cho nữ",
        description:
          "Điện thoại gập vỏ sò siêu cute màu tím. Màn hình phụ lớn nhất dòng Flip, dùng check tin nhắn hay soi gương trang điểm tiện lợi. Nếp gấp màn hình gần như tàng hình. Máy con gái dùng giữ kỹ, còn hộp và sạc nhanh SuperVOOC. Thích hợp làm quà tặng bạn gái.",
        price: 11500000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getLoc(2),
        images: [
          "https://images.unsplash.com/photo-1592750475338-74b7b2191392?w=500",
        ],
        brand: "Oppo",
        modelName: "Find N2 Flip",
      },
      {
        sellerId: getUser(4),
        category: "PHONE",
        title: "Nokia 1280 huyền thoại chống cháy",
        description:
          "Dọn nhà ra con máy cỏ. Loa to sóng khỏe, pin chờ cả tuần. Rớt 7749 lần không hư. Thích hợp mua về cho người già ở quê nghe gọi hoặc lắp sim rác.",
        price: 150000,
        condition: "POOR",
        status: "ACTIVE",
        location: getLoc(4),
        images: [
          "https://images.unsplash.com/photo-1580910051074-3eb6948d3cc0?w=500",
        ],
        brand: "Nokia",
        modelName: "1280",
      },

      // --- LAPTOPS (5 items) ---
      {
        sellerId: getUser(0),
        category: "LAPTOP",
        title: "MacBook Air M1 2020 Gold - Vua văn phòng",
        description:
          "Bản Base Ram 8GB SSD 256GB. Chip M1 giờ vẫn quá mạnh, edit video CapCut hay Photoshop nhẹ nhàng vô tư. Điểm mạnh nhất là pin dùng thực tế 10 tiếng, đi cafe làm việc không cần mang sạc. Máy không quạt tản nhiệt nên im re tuyệt đối. Hình thức 99%, sạc 45 lần.",
        price: 14500000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getLoc(0),
        images: [
          "https://images.unsplash.com/photo-1611186871348-640e787d11d0?w=500",
        ],
        brand: "Apple",
        modelName: "MacBook Air M1",
      },
      {
        sellerId: getUser(2),
        category: "LAPTOP",
        title: "Laptop Gaming Asus TUF F15 i7 RTX 3050",
        description:
          "Cần tiền build PC nên bán. Cấu hình khủng: Core i7 11800H, Card rời RTX 3050, Ram đã nâng lên 16GB, Màn hình 144Hz mượt mà. Chiến tốt các game AAA như GTA V, Cyberpunk (medium), Valorant, LOL max setting. Máy tản nhiệt tốt nhưng quạt hơi ồn khi chơi game nặng.",
        price: 15800000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getLoc(2),
        images: [
          "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500",
        ],
        brand: "Asus",
        modelName: "TUF Gaming F15",
      },
      {
        sellerId: getUser(1),
        category: "LAPTOP",
        title: "Dell XPS 13 9310 4K Touch - Siêu mỏng nhẹ",
        description:
          "Dòng laptop doanh nhân cao cấp nhất của Dell. Màn hình 4K cảm ứng tràn viền InfinityEdge cực đẹp, màu sắc chuẩn đồ họa. Vỏ nhôm nguyên khối cắt CNC sang trọng. Nặng chỉ 1.2kg, bỏ vừa túi xách. Phù hợp cho sếp hoặc dân Sale hay đi gặp khách hàng.",
        price: 21000000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getLoc(1),
        images: [
          "https://images.unsplash.com/photo-1593642632823-8f78536788c6?w=500",
        ],
        brand: "Dell",
        modelName: "XPS 13",
      },
      {
        sellerId: getUser(4),
        category: "LAPTOP",
        title: "ThinkPad X1 Carbon Gen 6 cũ giá rẻ",
        description:
          "Máy nhập khẩu Nhật Bản. Bàn phím ThinkPad gõ sướng nhất thế giới, code xuyên đêm không mỏi tay. Cấu hình i5 Gen 8, Ram 8GB đủ code web, backend cơ bản. Ngoại hình xước dăm lớp nhung, màn hình có 1 điểm chết nhỏ xíu khó thấy. Giá tốt cho sinh viên IT.",
        price: 6500000,
        condition: "FAIR",
        status: "ACTIVE",
        location: getLoc(4),
        images: [
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500",
        ],
        brand: "Lenovo",
        modelName: "ThinkPad X1 Carbon",
      },
      {
        sellerId: getUser(0),
        category: "LAPTOP",
        title: "MacBook Pro 14 inch M1 Pro 16GB/512GB",
        description:
          "Quái vật hiệu năng cho Designer và Coder. Màn hình Mini-LED XDR 120Hz đỉnh cao, màu đen sâu như OLED. Cổng kết nối đầy đủ (HDMI, Thẻ nhớ) không cần Hub chuyển. Loa nghe nhạc cực hay. Còn gói bảo hành Apple Care+ đến 2026.",
        price: 32000000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getLoc(0),
        images: [
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500",
        ],
        brand: "Apple",
        modelName: "MacBook Pro 14",
      },

      // --- TABLETS (3 items) ---
      {
        sellerId: getUser(1),
        category: "TABLET",
        title: "iPad Gen 9 64GB Wifi - Máy học online",
        description:
          "Mua về cho con học tiếng Anh nhưng giờ bé chán. Máy chủ yếu xem YouTube Kids. Mọi chức năng ổn định, pin rất trâu. Dòng iPad giá rẻ nhưng hiệu năng ngon nhất tầm giá. Tặng kèm bao da gấu cute và cường lực đã dán.",
        price: 5200000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getLoc(1),
        images: [
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500",
        ],
        brand: "Apple",
        modelName: "iPad Gen 9",
      },
      {
        sellerId: getUser(2),
        category: "TABLET",
        title: "Samsung Galaxy Tab S9 Ultra - Thay thế Laptop",
        description:
          "Máy tính bảng Android màn hình siêu to khổng lồ 14.6 inch. Chống nước kháng bụi IP68 đầu tiên dòng Tab. Dùng kèm Samsung DeX làm việc như Laptop. Loa 4 hướng to như loa bluetooth. Kèm bàn phím bao da chính hãng (trị giá 5tr lúc mua).",
        price: 22000000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getLoc(2),
        images: [
          "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=500",
        ],
        brand: "Samsung",
        modelName: "Tab S9 Ultra",
      },
      {
        sellerId: getUser(4),
        category: "TABLET",
        title: "iPad Mini 6 64GB Pink - Máy game cầm tay",
        description:
          "Kích thước nhỏ gọn bằng quyển sổ tay, cầm 1 tay chơi PUBG, Liên Quân cực sướng không mỏi. Chip A15 Bionic vẫn rất mạnh. Màu hồng nữ tính. Góc máy bị cấn nhẹ do rơi 1 lần, màn hình không nứt vỡ. Bán rẻ cho ai mua về cày game.",
        price: 8500000,
        condition: "FAIR",
        status: "ACTIVE",
        location: getLoc(4),
        images: [
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500",
        ],
        brand: "Apple",
        modelName: "iPad Mini 6",
      },

      // --- WATCHES (3 items) ---
      {
        sellerId: getUser(0),
        category: "WATCH",
        title: "Apple Watch Ultra 1 - Đồng hồ cho dân chạy bộ",
        description:
          "Thiết kế hầm hố, pin trâu 3 ngày (gấp đôi Apple Watch thường). Chuyên dụng cho chạy bộ trail, bơi lặn biển. GPS 2 băng tần cực chính xác. Viền Titan siêu bền, mặt kính Sapphire không trầy. Dây Alpine Loop màu cam nổi bật.",
        price: 13500000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getLoc(0),
        images: [
          "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500",
        ],
        brand: "Apple",
        modelName: "Watch Ultra",
      },
      {
        sellerId: getUser(2),
        category: "WATCH",
        title: "Garmin Fenix 7X Solar - Pin năng lượng mặt trời",
        description:
          "Dòng cao cấp nhất của Garmin. Kính Power Glass sạc pin bằng ánh sáng mặt trời, dùng chế độ tiết kiệm pin cả tháng mới sạc. Bản đồ Offline tích hợp sẵn, dẫn đường đi rừng đi núi không cần điện thoại. Đo nhịp tim, giấc ngủ chuyên sâu. Fullbox.",
        price: 18000000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getLoc(2),
        images: [
          "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500",
        ],
        brand: "Garmin",
        modelName: "Fenix 7X Solar",
      },
      {
        sellerId: getUser(4),
        category: "WATCH",
        title: "Huawei Watch GT3 dây da cũ",
        description:
          "Đồng hồ thông minh giá rẻ nhưng pin trâu 14 ngày. Nghe gọi trực tiếp trên đồng hồ rõ ràng. Màn hình AMOLED đẹp. Dây da hơi sờn theo thời gian sử dụng (có thể thay dây khác dễ dàng). Phù hợp cho ai cần theo dõi sức khỏe cơ bản.",
        price: 2100000,
        condition: "FAIR",
        status: "ACTIVE",
        location: getLoc(4),
        images: [
          "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500",
        ],
        brand: "Huawei",
        modelName: "Watch GT3",
      },

      // --- HEADPHONE (3 items) ---
      {
        sellerId: getUser(3),
        category: "HEADPHONE",
        title: "Tai nghe Sony WH-1000XM5 Chống ồn chủ động",
        description:
          "Vua chống ồn (ANC) hiện nay, đeo vào là điếc không nghe thấy tiếng người yêu cằn nhằn. Chất âm hay, bass sâu đặc trưng Sony. Thiết kế mới đeo êm hơn đời cũ. Màu đen, mới mua được 3 tháng tại Sony Center còn bảo hành dài.",
        price: 5800000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getLoc(3),
        images: [
          "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500",
        ],
        brand: "Sony",
        modelName: "WH-1000XM5",
      },
      {
        sellerId: getUser(0),
        category: "HEADPHONE",
        title: "AirPods 2 cũ - Tai nghe quốc dân",
        description:
          "Pass lại tai nghe AirPods 2. Kết nối iPhone mở nắp là nhận cực nhanh. Pin dock hơi chai, tai nghe nghe liên tục được khoảng 2h-2.5h. Phù hợp mua về nghe nhạc chống cháy hoặc đàm thoại video call. Đã vệ sinh sạch sẽ ráy tai bằng cồn.",
        price: 800000,
        condition: "POOR",
        status: "ACTIVE",
        location: getLoc(0),
        images: [
          "https://images.unsplash.com/photo-1572569028738-411a29630580?w=500",
        ],
        brand: "Apple",
        modelName: "AirPods 2",
      },
      {
        sellerId: getUser(1),
        category: "HEADPHONE",
        title: "Loa Marshall Stanmore II White - Decor phòng cực chill",
        description:
          "Loa bluetooth nhưng thiết kế Vintage cực đẹp, bày phòng khách hoặc quán cafe là hết ý. Chất âm mộc mạc, nghe Acoustic/Bolero rất hợp. Hàng xách tay US, điện 110-240V cắm trực tiếp. Màu trắng kem sang trọng, lưới ê-căng còn trắng sạch.",
        price: 4500000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getLoc(1),
        images: [
          "https://images.unsplash.com/photo-1545459720-aacaf5090834?w=500",
        ],
        brand: "Marshall",
        modelName: "Stanmore II",
      },

      // --- MAPPED CATEGORIES (Other, Accessory) ---

      // CAMERA -> Mapped to OTHER
      {
        sellerId: getUser(3),
        category: "OTHER",
        title: "Máy ảnh Sony Alpha A6400 + Lens Kit 16-50",
        description:
          "Combo máy ảnh mirrorless huyền thoại cho người mới tập chụp và quay video. Lấy nét siêu nhanh (Real-time Eye AF), quay video 4K không bị quá nhiệt. Sensor sạch, không mốc rễ tre. Tặng kèm túi đựng, thẻ nhớ 64GB và 2 pin for.",
        price: 16500000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getLoc(3),
        images: [
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500",
        ],
        brand: "Sony",
        modelName: "A6400",
      },
      {
        sellerId: getUser(3),
        category: "OTHER",
        title: "Fujifilm X-T30 II Body Silver - Màu ảnh Film cực nghệ",
        description:
          "Máy ảnh cho ai lười chỉnh sửa hậu kỳ, chụp phát ăn ngay với các giả lập màu Film (Classic Chrome, Nostalgic Neg). Ngoại hình Classic Retro siêu đẹp. Máy Like New chụp chưa đến 1k shot. Còn bảo hành chính hãng Fujifilm VN.",
        price: 19000000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getLoc(3),
        images: [
          "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500",
        ],
        brand: "Fujifilm",
        modelName: "X-T30 II",
      },
      {
        sellerId: getUser(4),
        category: "ACCESSORY", // Tripod -> Accessory
        title: "Chân máy ảnh Tripod Benro T880EX",
        description:
          "Chân máy nhôm nhẹ nhưng chắc chắn, chịu tải 5kg. Dùng để phơi sáng chụp cảnh đêm hoặc quay video cố định. Hơi trầy chân do di chuyển nhiều đi phượt. Các khớp khóa vẫn còn chặt.",
        price: 250000,
        condition: "FAIR",
        status: "ACTIVE",
        location: getLoc(4),
        images: [
          "https://images.unsplash.com/photo-1470116073782-48ae244710c7?w=500",
        ],
        brand: "Benro",
        modelName: "T880EX",
      },

      // CONSOLE -> Mapped to OTHER
      {
        sellerId: getUser(2),
        category: "OTHER",
        title: "Máy chơi game Sony PS5 Standard (Bản có ổ đĩa)",
        description:
          "Bản Standard có thể chơi game bằng đĩa hoặc Digital. Đời CFI-1200 tản nhiệt mát mẻ hơn. Kèm 2 tay cầm DualSense rung phản hồi cực sướng. Tặng kèm đĩa game God of War Ragnarok. Ít chơi do bận đi làm nên bán.",
        price: 10500000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getLoc(2),
        images: [
          "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500",
        ],
        brand: "Sony",
        modelName: "PlayStation 5",
      },
      {
        sellerId: getUser(2),
        category: "OTHER",
        title: "Nintendo Switch OLED đã Hack Modchip",
        description:
          "Máy màn hình OLED rực rỡ, chơi cầm tay (handheld) cực đã. Đã hack mod chip, cài sẵn Tinfoil tải game miễn phí trực tiếp trên máy (Zelda, Mario, Pokemon...). Thẻ nhớ 256GB chứa full game. Đã dán cường lực màn hình.",
        price: 6800000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getLoc(2),
        images: [
          "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500",
        ],
        brand: "Nintendo",
        modelName: "Switch OLED",
      },

      // SMARTHOME -> Mapped to OTHER
      {
        sellerId: getUser(1),
        category: "OTHER",
        title: "Robot hút bụi Roborock S7 MaxV Ultra",
        description:
          "Robot thông minh nhất hệ mặt trời: Tự giặt giẻ, tự sấy khô, tự đổ rác, tự cấp nước. Lực hút 5100Pa hút sạch lông chó mèo. Camera AI nhận diện vật cản (dây điện, đồ chơi, phân thú cưng) để né. Mới dùng 6 tháng, giải phóng sức lao động cho chị em.",
        price: 18500000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getLoc(1),
        images: [
          "https://images.unsplash.com/photo-1583862499327-32e290d40679?w=500",
        ],
        brand: "Roborock",
        modelName: "S7 MaxV Ultra",
      },

      // PC & LINH KIEN -> Mapped to ACCESSORY/OTHER
      {
        sellerId: getUser(2),
        category: "ACCESSORY",
        title: "Card màn hình VGA RTX 3070 Ti Gaming X Trio",
        description:
          "Hàng người dùng chơi game, cam kết không trâu cày coin. Fullbox trùng seri. Chiến mọi game AAA ở độ phân giải 2K Ultra setting. Nhiệt độ mát mẻ (Fullload 70 độ), led RGB đẹp lung linh đồng bộ Mystic Light. Còn bảo hành hãng 1 năm.",
        price: 8500000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getLoc(2),
        images: [
          "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500",
        ],
        brand: "MSI",
        modelName: "RTX 3070 Ti",
      },

      // TV / MAN HINH -> Mapped to OTHER
      {
        sellerId: getUser(1),
        category: "OTHER",
        title: "Màn hình đồ họa LG 27UP850 4K USB-C",
        description:
          "Màn hình chuyên đồ họa 27 inch độ phân giải 4K siêu nét. Tấm nền IPS chuẩn màu 95% DCI-P3. Điểm đáng tiền là cổng USB-C hỗ trợ sạc ngược 96W, cắm MacBook vào là vừa xuất hình vừa sạc, bàn làm việc gọn gàng không dây nhợ. Không điểm chết, không hở sáng.",
        price: 7500000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getLoc(1),
        images: [
          "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500",
        ],
        brand: "LG",
        modelName: "27UP850",
      },
    ];

    const items = await Item.insertMany(itemsData);
    console.log(`📦 Created ${items.length} items`);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
};

seedData();
