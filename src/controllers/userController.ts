// controllers/userController.ts
import { Request, Response } from "express";
import { User } from "../models/User";

export const getPublicProfile = async (req: Request, res: Response) => {
  const userId = req.params.userId ?? req.params.id;
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Missing userId.",
    });
  }

  try {
    // Only expose public profile fields
    const user = await User.findById(userId)
      .select(
        "fullName avatar rating reviewCount successfulTrades lastActiveAt address createdAt isVerified"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};
