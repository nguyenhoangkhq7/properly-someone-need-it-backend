import { Router } from "express";
import type { CookieOptions, Request, Response } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { User, EmailOtp, type OtpPurpose } from "../models/index";
import type { IUser } from "../models/User";
import { sendError, sendSuccess } from "../utils/response";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwtHelper";
import { sendOtpEmail } from "../utils/email";
import requireAuth from "../middleware/requireAuth";

const router = Router();
const MAX_OTP_ATTEMPTS = env.OTP_MAX_ATTEMPTS;
const OTP_TTL_MS = env.OTP_TTL_MINUTES * 60 * 1000;
const REFRESH_COOKIE_NAME = "psni_refresh";
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 ngÃ y
const isProduction = process.env.NODE_ENV === "production";

const buildRefreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: REFRESH_COOKIE_MAX_AGE,
  path: `${env.API_PREFIX}/auth`,
});

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, buildRefreshCookieOptions());
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...buildRefreshCookieOptions(),
    maxAge: 0,
  });
};

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
  keyGenerator: (req: Request) => resolveRateLimitKey(req),
  handler: (_req: Request, res: Response) =>
    sendError(res, 429, "Báº¡n Ä‘Ã£ gá»­i OTP quÃ¡ nhiá»u láº§n, thá»­ láº¡i sau.", "RATE_LIMIT"),
});

const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => resolveRateLimitKey(req),
  handler: (_req: Request, res: Response) =>
    sendError(res, 429, "Báº¡n thao tÃ¡c quÃ¡ nhanh, thá»­ láº¡i sau.", "RATE_LIMIT"),
});

const normalizePhone = (phone: string): string => phone.replace(/\D/g, "");
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const ensureValidEmail = (rawEmail: string): string => {
  const email = normalizeEmail(rawEmail);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AuthError("Email khÃ´ng há»£p lá»‡.", "EMAIL_INVALID", 400);
  }
  return email;
};

const ensureOtpPurpose = (value: string): OtpPurpose => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "login" || normalized === "register") {
    return normalized;
  }
  throw new AuthError(
    "Má»¥c Ä‘Ã­ch gá»­i OTP khÃ´ng há»£p lá»‡.",
    "OTP_PURPOSE_INVALID",
    400
  );
};

const ensureValidPhone = (rawPhone: string): string => {
  const phone = normalizePhone(rawPhone);
  if (phone.length < 9) {
    throw new AuthError(
      "Sá»‘ Ä‘iá»‡n thoáº¡i khÃ´ng há»£p lá»‡.",
      "PHONE_INVALID",
      400
    );
  }
  return phone;
};

const createTokens = (user: Pick<IUser, "_id" | "role">) => ({
  accessToken: signAccessToken(user._id.toString(), user.role),
  refreshToken: signRefreshToken(user._id.toString(), user.role),
});

const issueTokensForUser = async (user: IUser) => {
  const tokens = createTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();
  return tokens;
};

const buildOtpExpiry = (): Date => new Date(Date.now() + OTP_TTL_MS);

const requireFields = (fields: string[], body: Record<string, any>) => {
  const missing = fields.filter((field) => !body?.[field]);
  if (missing.length) {
    throw new AuthError(
      `Thiáº¿u thÃ´ng tin: ${missing.join(", ")}`,
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
    throw new AuthError("OTP khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ háº¿t háº¡n.", "OTP_NOT_FOUND", 400);
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    await record.deleteOne();
    throw new AuthError("OTP Ä‘Ã£ háº¿t háº¡n, vui lÃ²ng gá»­i láº¡i.", "OTP_EXPIRED", 400);
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await record.deleteOne();
    throw new AuthError(
      "Báº¡n Ä‘Ã£ nháº­p sai OTP quÃ¡ sá»‘ láº§n cho phÃ©p, vui lÃ²ng gá»­i láº¡i.",
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
        "Báº¡n Ä‘Ã£ nháº­p sai OTP quÃ¡ sá»‘ láº§n cho phÃ©p, vui lÃ²ng gá»­i láº¡i.",
        "OTP_MAX_ATTEMPTS",
        400
      );
    }
    throw new AuthError(
      "OTP khÃ´ng chÃ­nh xÃ¡c, vui lÃ²ng thá»­ láº¡i.",
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
            "Email chÆ°a Ä‘Æ°á»£c Ä‘Äƒng kÃ½, vui lÃ²ng táº¡o tÃ i khoáº£n trÆ°á»›c.",
            "USER_NOT_FOUND",
            400
          );
        }
      } else {
        const existing = await User.findOne({ email });
        if (existing) {
          throw new AuthError("Email Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ½.", "USER_EXISTS", 400);
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
      return sendSuccess(res, { email }, "OTP Ä‘Ã£ Ä‘Æ°á»£c gá»­i");
    } catch (error) {
      if (error instanceof AuthError) {
        return sendError(res, error.statusCode, error.message, error.errorCode);
      }
      console.error("/send-otp error", error);
      return sendError(res, 500, "KhÃ´ng thá»ƒ gá»­i OTP", "OTP_SEND_FAILED");
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
      throw new AuthError("Email Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ½.", "USER_EXISTS", 400);
    }

    if (phoneOwner) {
      throw new AuthError("Sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ½.", "PHONE_EXISTS", 400);
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

    const tokens = await issueTokensForUser(user);
    setRefreshTokenCookie(res, tokens.refreshToken);
    return sendSuccess(
      res,
      { accessToken: tokens.accessToken, role: user.role },
      "ÄÄƒng kÃ½ thÃ nh cÃ´ng"
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return sendError(res, error.statusCode, error.message, error.errorCode);
    }
    console.error("/register error", error);
    return sendError(res, 500, "KhÃ´ng thá»ƒ Ä‘Äƒng kÃ½", "REGISTER_FAILED");
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
        "TÃ i khoáº£n khÃ´ng tá»“n táº¡i, vui lÃ²ng Ä‘Äƒng kÃ½ trÆ°á»›c.",
        "USER_NOT_FOUND",
        404
      );
    }

    await validateOtp(email, otp, "login");

    const tokens = await issueTokensForUser(user);
    setRefreshTokenCookie(res, tokens.refreshToken);
    return sendSuccess(
      res,
      { accessToken: tokens.accessToken, role: user.role },
      "ÄÄƒng nháº­p thÃ nh cÃ´ng"
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return sendError(res, error.statusCode, error.message, error.errorCode);
    }
    console.error("/login error", error);
    return sendError(res, 500, "KhÃ´ng thá»ƒ Ä‘Äƒng nháº­p", "LOGIN_FAILED");
  }
});

router.post("/refresh-token", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new AuthError("Refresh token khÃ´ng tá»“n táº¡i.", "REFRESH_INVALID", 401);
    }

    const payload = verifyRefreshToken(String(refreshToken));
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AuthError(
        "NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i, refresh token khÃ´ng há»£p lá»‡.",
        "USER_NOT_FOUND",
        404
      );
    }

    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      user.refreshToken = null;
      await user.save();
      clearRefreshTokenCookie(res);
      throw new AuthError(
        "Refresh token khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ bá»‹ thu há»“i.",
        "REFRESH_INVALID",
        401
      );
    }

    const tokens = await issueTokensForUser(user);
    setRefreshTokenCookie(res, tokens.refreshToken);
    return sendSuccess(
      res,
      { accessToken: tokens.accessToken, role: user.role },
      "Refresh thÃ nh cÃ´ng"
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return sendError(res, error.statusCode, error.message, error.errorCode);
    }

    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
    ) {
      return sendError(res, 401, "Refresh token khÃ´ng há»£p lá»‡", "REFRESH_INVALID");
    }

    console.error("/refresh-token error", error);
    return sendError(res, 500, "KhÃ´ng thá»ƒ refresh token", "REFRESH_FAILED");
  }
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AuthError("KhÃ´ng xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c ngÆ°á»i dÃ¹ng.", "AUTH_REQUIRED", 401);
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      throw new AuthError("NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i.", "USER_NOT_FOUND", 404);
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
      role,
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
        role,
      },
      "Láº¥y thÃ´ng tin ngÆ°á»i dÃ¹ng thÃ nh cÃ´ng"
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return sendError(res, error.statusCode, error.message, error.errorCode);
    }
    console.error("/me error", error);
    return sendError(res, 500, "KhÃ´ng thá»ƒ láº¥y thÃ´ng tin ngÆ°á»i dÃ¹ng", "FETCH_PROFILE_FAILED");
  }
});

router.post("/logout", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      throw new AuthError("Báº¡n chÆ°a Ä‘Äƒng nháº­p.", "AUTH_REQUIRED", 401);
    }

    await User.findByIdAndUpdate(req.userId, { $set: { refreshToken: null } });
    clearRefreshTokenCookie(res);
    return sendSuccess(res, { success: true }, "ÄÄƒng xuáº¥t thÃ nh cÃ´ng");
  } catch (error) {
    if (error instanceof AuthError) {
      return sendError(res, error.statusCode, error.message, error.errorCode);
    }
    console.error("/logout error", error);
    return sendError(res, 500, "KhÃ´ng thá»ƒ Ä‘Äƒng xuáº¥t", "LOGOUT_FAILED");
  }
});

export default router;


