import mongoose from "mongoose";
import { User, Item } from "../models/index";

const MONGO_URI = "mongodb://localhost:27017/psni";

const seedMoreData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected for seeding more data");

    // ==================== 1. TẠO THÊM 5 USERS (User 6 - 10) ====================
    // Đa dạng hóa vị trí: Cần Thơ, Hải Phòng, Vũng Tàu...
    const newUsers = await User.insertMany([
      {
        fullName: "Kevin Tuấn", // Reviewer công nghệ
        email: "kevin.tuan@tech.com",
        phone: "0911223344",
        avatar: "https://i.pravatar.cc/150?img=12",
        address: {
          city: "TP Hồ Chí Minh",
          district: "Quận 7",
          location: { type: "Point", coordinates: [106.7337, 10.7361] },
        },
        rating: 5.0,
        reviewCount: 40,
        successfulTrades: 50,
        trustScore: 100,
        isVerified: true,
      },
      {
        fullName: "Đỗ Thị Lan Anh", // Dân văn phòng, thích đồ decor
        email: "lananh.do@office.com",
        phone: "0922334455",
        avatar: "https://i.pravatar.cc/150?img=9",
        address: {
          city: "Hà Nội",
          district: "Tây Hồ",
          location: { type: "Point", coordinates: [105.8188, 21.0567] },
        },
        rating: 4.9,
        reviewCount: 10,
        successfulTrades: 10,
        trustScore: 95,
        isVerified: true,
      },
      {
        fullName: "Phan Hải Đăng", // Gamer, Streamer
        email: "dang.gamer@stream.com",
        phone: "0933445566",
        avatar: "https://i.pravatar.cc/150?img=60",
        address: {
          city: "Hải Phòng",
          district: "Lê Chân",
          location: { type: "Point", coordinates: [106.6817, 20.8561] },
        },
        rating: 4.6,
        reviewCount: 5,
        successfulTrades: 12,
        trustScore: 88,
        isVerified: false,
      },
      {
        fullName: "Vũ Mai Phương", // Nội trợ hiện đại, Smarthome
        email: "phuong.vu@home.com",
        phone: "0944556677",
        avatar: "https://i.pravatar.cc/150?img=44",
        address: {
          city: "Đà Nẵng",
          district: "Sơn Trà",
          location: { type: "Point", coordinates: [108.2399, 16.0667] },
        },
        rating: 5.0,
        reviewCount: 3,
        successfulTrades: 3,
        trustScore: 90,
        isVerified: true,
      },
      {
        fullName: "Trịnh Quốc Bảo", // Coder, Developer
        email: "bao.dev@code.com",
        phone: "0955667788",
        avatar: "https://i.pravatar.cc/150?img=68",
        address: {
          city: "Cần Thơ",
          district: "Ninh Kiều",
          location: { type: "Point", coordinates: [105.7795, 10.0452] },
        },
        rating: 4.8,
        reviewCount: 20,
        successfulTrades: 25,
        trustScore: 99,
        isVerified: true,
      },
    ]);

    console.log(`➕ Added ${newUsers.length} new users`);

    const getNewUser = (idx: number) => newUsers[idx % 5]._id;
    const getNewLoc = (idx: number) => newUsers[idx % 5].address.location;

    // ==================== 2. TẠO THÊM 20 ITEMS (Semantic Rich) ====================
    const newItemsData = [
      // --- PC & LINH KIỆN (Mapped to ACCESSORY) ---
      {
        sellerId: getNewUser(4), // Coder
        category: "ACCESSORY",
        title: "Bàn phím cơ Keychron K8 Pro Nhôm",
        description:
          "Bàn phím cơ custom sẵn, switch Gateron G Pro Red gõ lướt cực êm, đã mod foam tiêu âm. Layout TKL gọn gàng cho anh em Developer code xuyên đêm không ồn. Kết nối Bluetooth 3 thiết bị, chuyển đổi mượt mà giữa Mac và Win. Fullbox đầy đủ keycap.",
        price: 2100000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getNewLoc(4),
        images: [
          "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500",
        ],
        brand: "Keychron",
        modelName: "K8 Pro",
      },
      {
        sellerId: getNewUser(2), // Gamer
        category: "ACCESSORY",
        title: "Màn hình Gaming LG UltraGear 27GL850 2K 144Hz",
        description:
          "Màn hình quốc dân cho game thủ FPS. Tấm nền Nano IPS cho màu sắc rực rỡ, tần số quét 144Hz 1ms mượt mà không bóng mờ. Hỗ trợ G-Sync/FreeSync. Chân đế xoay dọc được. Màn không điểm chết, còn bảo hành hãng 6 tháng.",
        price: 5500000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getNewLoc(2),
        images: [
          "https://images.unsplash.com/photo-1616763355614-4c670034785f?w=500",
        ],
        brand: "LG",
        modelName: "27GL850",
      },
      {
        sellerId: getNewUser(4), // Coder
        category: "ACCESSORY",
        title: "Chuột Logitech MX Master 3S for Mac",
        description:
          "Chuột văn phòng tốt nhất thế giới. Click silent không gây tiếng ồn trong văn phòng. Cuộn vô cực Magspeed siêu nhanh để lướt 1000 dòng code. Thiết kế công thái học đỡ mỏi cổ tay. Pin sạc 1 lần dùng 2 tháng. Màu xám không gian.",
        price: 1800000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getNewLoc(4),
        images: [
          "https://images.unsplash.com/photo-1615663245857-acda5b2b15d5?w=500",
        ],
        brand: "Logitech",
        modelName: "MX Master 3S",
      },

      // --- CONSOLE & GAME (Mapped to OTHER) ---
      {
        sellerId: getNewUser(2), // Gamer
        category: "OTHER",
        title: "Xbox Series X - Máy chơi game 4K",
        description:
          "Cỗ máy chiến game mạnh nhất của Microsoft. Chơi game mượt mà ở 4K 120FPS. Kèm tài khoản GamePass Ultimate còn 1 năm (chơi Forza, Halo, FIFA miễn phí). Máy hoạt động êm ru, không tiếng ồn. Tặng kèm 2 tay cầm.",
        price: 11000000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getNewLoc(2),
        images: [
          "https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=500",
        ],
        brand: "Microsoft",
        modelName: "Xbox Series X",
      },
      {
        sellerId: getNewUser(2), // Gamer
        category: "OTHER",
        title: "Máy chơi game cầm tay Steam Deck 64GB",
        description:
          "PC Gaming cầm tay, chơi được hầu hết game trên Steam (Elden Ring, God of War, Cyberpunk). Đã nâng cấp SSD lên 512GB tha hồ cài game. Máy dán skin Gundam cực ngầu. Phù hợp cho ai hay đi công tác muốn chơi game AAA.",
        price: 9500000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getNewLoc(2),
        images: [
          "https://images.unsplash.com/photo-1659263952589-30d04d3a7976?w=500",
        ],
        brand: "Valve",
        modelName: "Steam Deck",
      },

      // --- CAMERA (Mapped to OTHER) ---
      {
        sellerId: getNewUser(0), // Reviewer
        category: "OTHER",
        title: "Máy ảnh Canon EOS R50 - Chuyên Vlog",
        description:
          "Máy ảnh nhỏ gọn nhất dòng R của Canon. Quay phim 4K không crop, lấy nét Dual Pixel cực nhanh, màn hình xoay lật để tự quay Vlog/TikTok. Màu da Canon chụp chân dung hồng hào không cần chỉnh sửa. Kèm lens kit 18-45mm nhỏ gọn.",
        price: 14500000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getNewLoc(0),
        images: [
          "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=500",
        ],
        brand: "Canon",
        modelName: "EOS R50",
      },
      {
        sellerId: getNewUser(0), // Reviewer
        category: "OTHER",
        title: "Gimbal chống rung DJI RS3 Mini",
        description:
          "Gimbal nhỏ gọn cho máy ảnh Mirrorless. Tải trọng 2kg cân tốt Sony A7IV + Lens 24-70GM. Có chế độ quay dọc (Native Vertical) để quay TikTok/Reels không cần phụ kiện. Pin trâu 10 tiếng. Mới dùng quay đúng 1 dự án.",
        price: 5500000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getNewLoc(0),
        images: [
          "https://images.unsplash.com/photo-1566206091558-7c21666fb89c?w=500",
        ],
        brand: "DJI",
        modelName: "RS3 Mini",
      },

      // --- SMARTHOME (Mapped to OTHER) ---
      {
        sellerId: getNewUser(3), // Smarthome User
        category: "OTHER",
        title: "Khóa cửa thông minh Xiaomi Aqara N100",
        description:
          "Khóa cửa vân tay cao cấp, hỗ trợ Apple HomeKit. Mở khóa bằng vân tay, mật khẩu, thẻ từ, chìa cơ hoặc mở qua iPhone. Chốt khóa tự động an toàn. Hàng quốc tế server ổn định. Mới 100% chưa lắp đặt do đổi ý định dùng cửa kính.",
        price: 3800000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getNewLoc(3),
        images: [
          "https://images.unsplash.com/photo-1558002038-1091a166272c?w=500",
        ],
        brand: "Aqara",
        modelName: "N100",
      },
      {
        sellerId: getNewUser(3), // Smarthome User
        category: "OTHER",
        title: "Camera an ninh Eufy Indoor 2K",
        description:
          "Camera giám sát trong nhà độ phân giải 2K sắc nét. Có AI phát hiện người và thú cưng, báo động khi có tiếng khóc trẻ em. Lưu trữ thẻ nhớ không tốn tiền Cloud. Xoay 360 độ. Hỗ trợ Google Assistant và Alexa.",
        price: 750000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getNewLoc(3),
        images: [
          "https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=500",
        ],
        brand: "Anker",
        modelName: "Eufy 2K",
      },

      // --- AUDIO (3 items) ---
      {
        sellerId: getNewUser(1), // Decor fan
        category: "HEADPHONE",
        title: "Loa Harman Kardon Aura Studio 3",
        description:
          "Loa 'nồi cơm điện' với thiết kế trong suốt độc đáo, đèn LED Ambient Light gợn sóng cực chill vào ban đêm. Âm thanh 360 độ lan tỏa khắp phòng, bass đánh rung bàn. Thích hợp nghe nhạc EDM, Pop. Fullbox còn bảo hành PGI.",
        price: 4200000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getNewLoc(1),
        images: [
          "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
        ],
        brand: "Harman Kardon",
        modelName: "Aura Studio 3",
      },
      {
        sellerId: getNewUser(4),
        category: "HEADPHONE",
        title: "Tai nghe Marshall Major IV",
        description:
          "Tai nghe chụp tai phong cách Retro. Pin khủng 80 giờ nghe nhạc (sạc 1 lần dùng cả tuần). Có sạc không dây. Chất âm Marshall đặc trưng, mid ngọt, guitar hay. Đệm tai hơi bong da nhẹ (bệnh chung dòng này), tặng kèm đệm thay thế.",
        price: 2100000,
        condition: "FAIR",
        status: "ACTIVE",
        location: getNewLoc(4),
        images: [
          "https://images.unsplash.com/photo-1629282190008-3678416ba23a?w=500",
        ],
        brand: "Marshall",
        modelName: "Major IV",
      },
      {
        sellerId: getNewUser(0),
        category: "HEADPHONE",
        title: "Loa thanh Soundbar Samsung Q600B",
        description:
          "Nâng cấp âm thanh cho TV. Hệ thống 3.1.2 kênh, hỗ trợ Dolby Atmos âm thanh vòm như rạp chiếu phim. Có loa Sub rời đánh bass siêu lực. Kết nối Bluetooth, HDMI eARC. Mới mua được 2 tháng, còn thùng xốp.",
        price: 3500000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getNewLoc(0),
        images: [
          "https://images.unsplash.com/photo-1545459720-aacaf5090834?w=500",
        ],
        brand: "Samsung",
        modelName: "HW-Q600B",
      },

      // --- PHONES (3 items) ---
      {
        sellerId: getNewUser(0), // Tech Reviewer
        category: "PHONE",
        title: "Google Pixel 8 nhỏ gọn - Camera AI",
        description:
          "Siêu phẩm nhỏ gọn, màn hình 120Hz độ sáng 2000 nits. Chip Tensor G3 hỗ trợ các tính năng AI độc quyền: Magic Eraser (xóa vật thể), Best Take (chỉnh mặt). Màu Hazel cực đẹp. Bản quốc tế 128GB. Máy trần.",
        price: 12500000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getNewLoc(0),
        images: [
          "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=500",
        ],
        brand: "Google",
        modelName: "Pixel 8",
      },
      {
        sellerId: getNewUser(1),
        category: "PHONE",
        title: "iPhone 11 64GB Tím mộng mơ",
        description:
          "Máy quốc tế Mỹ LL/A. Ngoại hình 97% có xước viền. Pin đã thay mới dung lượng cao 100%, dùng bao trâu. FaceID nhạy. Camera chụp vẫn rất đẹp so với tầm giá. Thích hợp cho học sinh sinh viên.",
        price: 5500000,
        condition: "FAIR",
        status: "ACTIVE",
        location: getNewLoc(1),
        images: [
          "https://images.unsplash.com/photo-1574755393849-623942496936?w=500",
        ],
        brand: "Apple",
        modelName: "iPhone 11",
      },
      {
        sellerId: getNewUser(3),
        category: "PHONE",
        title: "Xiaomi 13 Ultra - Máy ảnh có chức năng gọi điện",
        description:
          "Đỉnh cao nhiếp ảnh hợp tác với Leica. Cảm biến 1 inch siêu lớn, khẩu độ thay đổi được. Chụp ảnh xóa phông như máy cơ. Bản nội địa đã cài Rom quốc tế Full tiếng Việt, không trễ thông báo. Kèm ốp lưng Photography Kit.",
        price: 17500000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getNewLoc(3),
        images: [
          "https://images.unsplash.com/photo-1598327105666-5b89351aff23?w=500",
        ],
        brand: "Xiaomi",
        modelName: "13 Ultra",
      },

      // --- TABLET & LAPTOP (3 items) ---
      {
        sellerId: getNewUser(4), // Coder
        category: "LAPTOP",
        title: "MacBook Pro 16 inch M1 Max 32GB/1TB",
        description:
          "Cấu hình Max Option huỷ diệt mọi tác vụ nặng. Ram 32GB chạy Docker, máy ảo tẹt ga. SSD 1TB lưu trữ thoải mái. Máy dùng kỹ dán full body JCPAL. Pin còn 92%. Hàng hiếm cho anh em Dev chuyên nghiệp.",
        price: 42000000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getNewLoc(4),
        images: [
          "https://images.unsplash.com/photo-1531297461136-82lw9z1q1999?w=500",
        ],
        brand: "Apple",
        modelName: "MacBook Pro 16",
      },
      {
        sellerId: getNewUser(1),
        category: "TABLET",
        title: "Kindle Paperwhite 5 (11th Gen)",
        description:
          "Máy đọc sách màn hình 6.8 inch, đèn vàng ấm bảo vệ mắt. Bản 8GB chép truyện tranh Manga thoải mái. Pin dùng cả tháng. Ngoại hình đẹp, không xước màn. Tặng kèm cover da tự động tắt mở.",
        price: 2800000,
        condition: "LIKE_NEW",
        status: "ACTIVE",
        location: getNewLoc(1),
        images: [
          "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500",
        ],
        brand: "Amazon",
        modelName: "Kindle Paperwhite 5",
      },
      {
        sellerId: getNewUser(2),
        category: "LAPTOP",
        title: "Laptop Acer Nitro 5 Tiger i5 12500H",
        description:
          "Laptop gaming giá rẻ quốc dân. Thiết kế hầm hố, tản nhiệt tốt. Cấu hình i5 Gen 12, RTX 3050Ti chiến tốt FIFA 4, Valorant. Phím LED RGB 4 vùng. Còn bảo hành hãng 3 tháng.",
        price: 13500000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getNewLoc(2),
        images: [
          "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500",
        ],
        brand: "Acer",
        modelName: "Nitro 5",
      },

      // --- WATCH (2 items) ---
      {
        sellerId: getNewUser(3),
        category: "WATCH",
        title: "Đồng hồ cơ Seiko 5 Sport Automatic",
        description:
          "Đồng hồ cơ Nhật Bản, thiết kế lặn (Diver) nam tính. Mặt xanh Navy, máy lộ đáy (Open Back). Kính Hardlex chống trầy. Đã thay dây da bò handmade xịn, tặng kèm dây kim loại zin. Chạy chuẩn giờ, trữ cót 40h.",
        price: 3200000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getNewLoc(3),
        images: [
          "https://images.unsplash.com/photo-1623998021450-85c29c644e0d?w=500",
        ],
        brand: "Seiko",
        modelName: "Seiko 5",
      },
      {
        sellerId: getNewUser(1),
        category: "WATCH",
        title: "Apple Watch Series 8 41mm Nhôm Starlight",
        description:
          "Bản nhôm size nhỏ 41mm phù hợp tay nữ. Có cảm biến đo nhiệt độ cơ thể theo dõi chu kỳ rụng trứng. Pin còn 95%. Viền có 1 vết cấn nhỏ tí xíu soi kỹ mới thấy. Fullbox dây cao su zin.",
        price: 6500000,
        condition: "GOOD",
        status: "ACTIVE",
        location: getNewLoc(1),
        images: [
          "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500",
        ],
        brand: "Apple",
        modelName: "Series 8",
      },
    ];

    await Item.insertMany(newItemsData);
    console.log(`📦 Added ${newItemsData.length} new items`);

    console.log("✅ SEED MORE COMPLETED!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed More Error:", err);
    process.exit(1);
  }
};

seedMoreData();
