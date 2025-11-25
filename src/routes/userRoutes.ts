import { Router, Request, Response } from "express";
import { getPublicProfile, updateMyProfile } from "../controllers/userController";
import requireAuth from "../middleware/requireAuth";
import { User } from "../models/User";

const router = Router();

router.use(requireAuth);

router.get("/:id/profile", getPublicProfile);
router.put("/me", updateMyProfile);

// Lấy danh sách tất cả user (chỉ admin)
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    // Kiểm tra role admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const users = await User.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách người dùng" });
  }
});

// Lấy chi tiết user theo id (chỉ admin)
router.get("/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    // Kiểm tra role admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const { userId } = req.params;
    const targetUser = await User.findById(userId).lean();
    if (!targetUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    return res.status(200).json(targetUser);
  } catch (error) {
    console.error("Get user detail error:", error);
    return res.status(500).json({ message: "Không thể lấy chi tiết người dùng" });
  }
});

// Cập nhật trạng thái chặn/mở chặn user (chỉ admin)
router.patch("/:userId/ban", requireAuth, async (req: Request, res: Response) => {
  try {
    // Kiểm tra role admin
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const { userId } = req.params;
    const { isBanned } = req.body as { isBanned?: boolean };
    if (typeof isBanned !== "boolean") {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }
    const update = isBanned
      ? { isBanned: true, bannedAt: new Date() }
      : { isBanned: false, $unset: { bannedAt: 1 } };
    const targetUser = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
    if (!targetUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    return res.status(200).json(targetUser);
  } catch (error) {
    console.error("Update user ban status error:", error);
    return res.status(500).json({ message: "Không thể cập nhật trạng thái người dùng" });
  }
});

export default router;
