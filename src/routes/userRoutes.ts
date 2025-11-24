import { Router, Request, Response } from "express";
import { getPublicProfile } from "../controllers/userController";
import { User } from "../models/User";

const router = Router();

router.get("/:id/profile", getPublicProfile);

// Lấy danh sách tất cả user
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách người dùng" });
  }
});

// Lấy chi tiết user theo id
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Get user detail error:", error);
    return res.status(500).json({ message: "Không thể lấy chi tiết người dùng" });
  }
});

// Cập nhật trạng thái chặn/mở chặn user
router.patch("/:userId/ban", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isBanned } = req.body as { isBanned?: boolean };
    if (typeof isBanned !== "boolean") {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }
    const update = isBanned
      ? { isBanned: true, bannedAt: new Date() }
      : { isBanned: false, $unset: { bannedAt: 1 } };
    const user = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Update user ban status error:", error);
    return res.status(500).json({ message: "Không thể cập nhật trạng thái người dùng" });
  }
});

export default router;
