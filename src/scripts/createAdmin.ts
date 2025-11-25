// scripts/createAdmin.ts
import mongoose from "mongoose";
import { User } from "../models/index";

const MONGO_URI = "mongodb://localhost:27017/psni";

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      return;
    }

    // Create admin user
    const adminUser = new User({
      fullName: "Admin User",
      email: "admin@test.com",
      phone: "+84900000000",
      avatar: "https://i.pravatar.cc/150?img=10",
      address: {
        city: "Hà Nội",
        district: "Cầu Giấy",
        location: { type: "Point", coordinates: [105.7924, 21.0305] },
      },
      rating: 5.0,
      reviewCount: 0,
      successfulTrades: 0,
      trustScore: 100,
      fcmTokens: ["fake-fcm-admin"],
      isVerified: true,
      role: "admin",
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully");
    console.log("Email: admin@test.com");
    console.log("Password: You need to set OTP for login");

  } catch (err) {
    console.error("❌ Create admin error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();