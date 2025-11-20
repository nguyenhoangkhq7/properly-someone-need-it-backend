import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { User, EmailOtp, type OtpPurpose } from "../models/index.js";
import { sendError, sendSuccess } from "../utils/response.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwtHelper.js";
import { sendOtpEmail } from "../utils/email.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();
const MAX_OTP_ATTEMPTS = env.OTP_MAX_ATTEMPTS;
const OTP_TTL_MS = env.OTP_TTL_MINUTES * 60 * 1000;

class AuthError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(message: string, errorCode: string, statusCode = 400) {
    super(message);
    this.name = "AuthError";
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }
}

const resolveRateLimitKey = (req: Request): string => {
  const maybeEmail =
    typeof req.body?.email === "string" ? normalizeEmail(req.body.email) : "";
  const ip = req.ip ?? "unknown";
  return maybeEmail || ip;
};

const createOtpLimiter = rateLimit({
  windowMs: env.OTP_RATE_LIMIT_WINDOW_MS,
  limit: env.OTP_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => resolveRateLimitKey(req as Request),
  handler: (_req, res) =>
    sendError(res, 429, "Bạn đã gửi OTP quá nhiều lần, thử lại sau.", "RATE_LIMIT"),
});

const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => resolveRateLimitKey(req as Request),
  handler: (_req, res) =>
    sendError(res, 429, "Bạn thao tác quá nhanh, thử lại sau.", "RATE_LIMIT"),
});

const normalizePhone = (phone: string): string => phone.replace(/\D/g, "");
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const ensureValidEmail = (rawEmail: string): string => {
  const email = normalizeEmail(rawEmail);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AuthError("Email không hợp lệ.", "EMAIL_INVALID", 400);
  }
  return email;
};

const ensureOtpPurpose = (value: string): OtpPurpose => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "login" || normalized === "register") {
    return normalized;
  }
  throw new AuthError(
    "Mục đích gửi OTP không hợp lệ.",
    "OTP_PURPOSE_INVALID",
    400
  );
};

const ensureValidPhone = (rawPhone: string): string => {
  const phone = normalizePhone(rawPhone);
  if (phone.length < 9) {
    throw new AuthError(
      "Số điện thoại không hợp lệ.",
      "PHONE_INVALID",
      400
    );
  }
  return phone;
};

const createTokens = (userId: string) => ({
  accessToken: signAccessToken(userId),
  refreshToken: signRefreshToken(userId),
});

const buildOtpExpiry = (): Date => new Date(Date.now() + OTP_TTL_MS);

const requireFields = (fields: string[], body: Record<string, any>) => {
  const missing = fields.filter((field) => !body?.[field]);
  if (missing.length) {
    throw new AuthError(
      `Thiếu thông tin: ${missing.join(", ")}`,
      "VALIDATION_ERROR",
      400
    );
  }
};

const validateOtp = async (
  email: string,
  otp: string,
  purpose: OtpPurpose
): Promise<void> => {
  const record = await EmailOtp.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (!record) {
    throw new AuthError("OTP không tồn tại hoặc đã hết hạn.", "OTP_NOT_FOUND", 400);
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    await record.deleteOne();
    throw new AuthError("OTP đã hết hạn, vui lòng gửi lại.", "OTP_EXPIRED", 400);
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await record.deleteOne();
    throw new AuthError(
      "Bạn đã nhập sai OTP quá số lần cho phép, vui lòng gửi lại.",
      "OTP_MAX_ATTEMPTS",
      400
    );
  }

  const isMatch = await bcrypt.compare(otp, record.otpHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await record.deleteOne();
      throw new AuthError(
        "Bạn đã nhập sai OTP quá số lần cho phép, vui lòng gửi lại.",
        "OTP_MAX_ATTEMPTS",
        400
      );
    }
    throw new AuthError(
      "OTP không chính xác, vui lòng thử lại.",
      "OTP_INVALID",
      400
    );
  }

  await record.deleteOne();
};

router.post(
  "/send-otp",
  createOtpLimiter,
  async (req: Request, res: Response) => {
    try {
      requireFields(["email", "purpose"], req.body);
      const email = ensureValidEmail(String(req.body.email));
      const purpose = ensureOtpPurpose(String(req.body.purpose));

      if (purpose === "login") {
        const user = await User.findOne({ email });
        if (!user) {
          throw new AuthError(
            "Email chưa được đăng ký, vui lòng tạo tài khoản trước.",
            "USER_NOT_FOUND",
            404
          );
        }
      } else {
        const existing = await User.findOne({ email });
        if (existing) {
          throw new AuthError("Email đã được đăng ký.", "USER_EXISTS", 400);
        }
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otpCode, 10);

      await EmailOtp.findOneAndUpdate(
        { email, purpose },
        { otpHash, attempts: 0, expiresAt: buildOtpExpiry() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await sendOtpEmail(email, otpCode, purpose);
      console.log(`[OTP] Email ${email}: ${otpCode}`);
      return sendSuccess(res, { email }, "OTP đã được gửi");
    } catch (error) {
      if (error instanceof AuthError) {
        return sendError(res, error.statusCode, error.message, error.errorCode);
      }
      console.error("/send-otp error", error);
      return sendError(res, 500, "Không thể gửi OTP", "OTP_SEND_FAILED");
    }
  }
);

router.post("/register", authLimiter, async (req: Request, res: Response) => {
  try {
    requireFields(["email", "phone", "otp", "fullName", "city"], req.body);
    const email = ensureValidEmail(String(req.body.email));
    const phone = ensureValidPhone(String(req.body.phone));
    const otp = String(req.body.otp).trim();

    await validateOtp(email, otp, "register");

    const [emailOwner, phoneOwner] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ phone }),
    ]);

    if (emailOwner) {
      throw new AuthError("Email đã được đăng ký.", "USER_EXISTS", 400);
    }

    if (phoneOwner) {
      throw new AuthError("Số điện thoại đã được đăng ký.", "PHONE_EXISTS", 400);
    }

    const user = await User.create({
      fullName: req.body.fullName,
      email,
      phone,
      address: {
        city: req.body.city,
        district: req.body.district,
      },
      isVerified: true,
      verifiedAt: new Date(),
    });

    const tokens = createTokens(user._id.toString());
    return sendSuccess(res, tokens, "Đăng ký thành công");
  } catch (error) {
    if (error instanceof AuthError) {
      return sendError(res, error.statusCode, error.message, error.errorCode);
    }
    console.error("/register error", error);
    return sendError(res, 500, "Không thể đăng ký", "REGISTER_FAILED");
  }
});

router.post("/login", authLimiter, async (req: Request, res: Response) => {
  try {
    requireFields(["email", "otp"], req.body);
    const email = ensureValidEmail(String(req.body.email));
    const otp = String(req.body.otp).trim();

    const user = await User.findOne({ email });
    if (!user) {
      throw new AuthError(
        "Tài khoản không tồn tại, vui lòng đăng ký trước.",
        "USER_NOT_FOUND",
        404
      );
    }

    await validateOtp(email, otp, "login");

    const tokens = createTokens(user._id.toString());
    return sendSuccess(res, tokens, "Đăng nhập thành công");
  } catch (error) {
    if (error instanceof AuthError) {
      return sendError(res, error.statusCode, error.message, error.errorCode);
    }
    console.error("/login error", error);
    return sendError(res, 500, "Không thể đăng nhập", "LOGIN_FAILED");
  }
});

router.post("/refresh-token", async (req: Request, res: Response) => {
  try {
    requireFields(["refreshToken"], req.body);
    const refreshToken = String(req.body.refreshToken).trim();
    if (!refreshToken) {
      throw new AuthError(
        "Refresh token không hợp lệ.",
        "REFRESH_INVALID",
        400
      );
    }

    const payload = verifyRefreshToken(String(refreshToken));
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AuthError(
        "Người dùng không tồn tại, refresh token không hợp lệ.",
        "USER_NOT_FOUND",
        404
      );
    }

    const accessToken = signAccessToken(user._id.toString());
    return sendSuccess(res, { accessToken }, "Refresh thành công");
  } catch (error) {
    if (error instanceof AuthError) {
      return sendError(res, error.statusCode, error.message, error.errorCode);
    }

    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
    ) {
      return sendError(res, 401, "Refresh token không hợp lệ", "REFRESH_INVALID");
    }

    console.error("/refresh-token error", error);
    return sendError(res, 500, "Không thể refresh token", "REFRESH_FAILED");
  }
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AuthError("Không xác định được người dùng.", "AUTH_REQUIRED", 401);
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      throw new AuthError("Người dùng không tồn tại.", "USER_NOT_FOUND", 404);
    }

    const {
      _id,
      fullName,
      email,
      phone,
      avatar,
      address,
      rating,
      reviewCount,
      trustScore,
      successfulTrades,
    } = user;

    return sendSuccess(
      res,
      {
        id: _id,
        fullName,
        email,
        phone,
        avatar: avatar ?? null,
        address: {
          city: address?.city ?? null,
          district: address?.district ?? null,
        },
        rating,
        reviewCount,
        trustScore,
        successfulTrades,
      },
      "Lấy thông tin người dùng thành công"
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return sendError(res, error.statusCode, error.message, error.errorCode);
    }
    console.error("/me error", error);
    return sendError(res, 500, "Không thể lấy thông tin người dùng", "FETCH_PROFILE_FAILED");
  }
});

export default router;
