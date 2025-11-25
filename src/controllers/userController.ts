import type { Request, Response } from "express";
import type { IUser } from "../models/User";
import { User } from "../models/User";
import { sendError, sendSuccess } from "../utils/response";

const buildPublicProfile = (user: IUser) => ({
  id: user._id,
  fullName: user.fullName,
  avatar: user.avatar ?? null,
  rating: user.rating,
  reviewCount: user.reviewCount,
  successfulTrades: user.successfulTrades,
  trustScore: user.trustScore,
  isVerified: user.isVerified,
  lastActiveAt: user.lastActiveAt,
  address: {
    city: user.address?.city ?? null,
    district: user.address?.district ?? null,
  },
  createdAt: user.createdAt,
});

const buildAccountProfile = (user: IUser) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar ?? null,
  address: {
    city: user.address?.city ?? null,
    district: user.address?.district ?? null,
  },
  rating: user.rating,
  reviewCount: user.reviewCount,
  trustScore: user.trustScore,
  successfulTrades: user.successfulTrades,
  role: user.role,
});

export const getPublicProfile = async (req: Request, res: Response) => {
  const userId = req.params.userId ?? req.params.id;
  if (!userId) {
    return sendError(res, 400, "Thiếu userId.", "USER_ID_REQUIRED");
  }

  try {
    const user = await User.findById(userId).lean<IUser>();

    if (!user) {
      return sendError(res, 404, "Không tìm thấy người dùng.", "USER_NOT_FOUND");
    }

    return sendSuccess(res, buildPublicProfile(user), "Lấy hồ sơ thành công");
  } catch (error) {
    console.error("Get profile error:", error);
    return sendError(res, 500, "Không thể lấy hồ sơ.", "PROFILE_FETCH_FAILED");
  }
};

const normalizePhone = (value: unknown): string | undefined => {
  if (typeof value === "string" || typeof value === "number") {
    const digits = String(value).replace(/\D/g, "");
    return digits || undefined;
  }
  return undefined;
};

const isLocationPayloadValid = (location: any): location is {
  type: "Point";
  coordinates: [number, number];
} => {
  return (
    location &&
    location.type === "Point" &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2 &&
    location.coordinates.every((value: unknown) => typeof value === "number")
  );
};

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 401, "Bạn cần đăng nhập.", "AUTH_REQUIRED");
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, "Không tìm thấy người dùng.", "USER_NOT_FOUND");
    }

    const { fullName, phone, avatar, address } = req.body ?? {};

    let hasChanges = false;

    if (typeof fullName === "string") {
      const trimmedName = fullName.trim();
      if (trimmedName.length < 2) {
        return sendError(res, 400, "Họ tên phải có ít nhất 2 ký tự.", "FULLNAME_INVALID");
      }
      if (trimmedName !== user.fullName) {
        user.fullName = trimmedName;
        hasChanges = true;
      }
    }

    if (phone !== undefined) {
      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone || normalizedPhone.length < 9) {
        return sendError(res, 400, "Số điện thoại không hợp lệ.", "PHONE_INVALID");
      }

      if (normalizedPhone !== user.phone) {
        const existingPhoneOwner = await User.findOne({
          phone: normalizedPhone,
          _id: { $ne: user._id },
        })
          .select("_id")
          .lean();

        if (existingPhoneOwner) {
          return sendError(
            res,
            409,
            "Số điện thoại đã được sử dụng.",
            "PHONE_EXISTS"
          );
        }

        user.phone = normalizedPhone;
        hasChanges = true;
      }
    }

    if (avatar !== undefined) {
      if (avatar === null || avatar === "") {
        if (user.avatar) {
          user.avatar = undefined;
          hasChanges = true;
        }
      } else if (typeof avatar === "string") {
        const trimmedAvatar = avatar.trim();
        if (trimmedAvatar && trimmedAvatar !== user.avatar) {
          user.avatar = trimmedAvatar;
          hasChanges = true;
        }
      } else {
        return sendError(res, 400, "Ảnh đại diện không hợp lệ.", "AVATAR_INVALID");
      }
    }

    if (address !== undefined) {
      const hasCity = Object.prototype.hasOwnProperty.call(address ?? {}, "city");
      const hasDistrict = Object.prototype.hasOwnProperty.call(address ?? {}, "district");
      const hasLocation = Object.prototype.hasOwnProperty.call(address ?? {}, "location");
      let addressUpdated = false;

      if (hasCity) {
        const cityValue = typeof address?.city === "string" ? address.city.trim() : "";
        if (!cityValue) {
          return sendError(res, 400, "Thành phố không hợp lệ.", "CITY_INVALID");
        }
        if (cityValue !== user.address?.city) {
          user.address.city = cityValue;
          addressUpdated = true;
        }
      }

      if (hasDistrict) {
        const districtValue =
          typeof address?.district === "string" ? address.district.trim() : undefined;
        if (districtValue !== user.address?.district) {
          user.address.district = districtValue || undefined;
          addressUpdated = true;
        }
      }

      if (hasLocation && isLocationPayloadValid(address?.location)) {
        const [lng, lat] = address.location.coordinates;
        const currentCoordinates = user.address?.location?.coordinates ?? [];
        if (currentCoordinates[0] !== lng || currentCoordinates[1] !== lat) {
          user.address.location = {
            type: "Point",
            coordinates: [lng, lat],
          };
          addressUpdated = true;
        }
      }

      hasChanges = hasChanges || addressUpdated;
    }

    if (!hasChanges) {
      return sendError(res, 400, "Không có dữ liệu cần cập nhật.", "NO_CHANGES");
    }

    await user.save();

    return sendSuccess(res, buildAccountProfile(user), "Cập nhật hồ sơ thành công");
  } catch (error) {
    console.error("Update profile error:", error);
    return sendError(res, 500, "Không thể cập nhật hồ sơ.", "PROFILE_UPDATE_FAILED");
  }
};
