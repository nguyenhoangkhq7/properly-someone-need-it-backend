import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwtHelper.js";
import { sendError } from "../utils/response.js";

const AUTH_HEADER_PREFIX = "bearer";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    return sendError(res, 401, "Bạn cần đăng nhập để tiếp tục.", "AUTH_REQUIRED");
  }

  const [scheme, token] = header.split(" ");
  if (!token || !scheme || scheme.toLowerCase() !== AUTH_HEADER_PREFIX) {
    return sendError(res, 401, "Token không hợp lệ.", "TOKEN_INVALID");
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    return next();
  } catch (error) {
    const isJwtError =
      error instanceof Error &&
      (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError");

    if (isJwtError) {
      return sendError(res, 401, "Token không hợp lệ hoặc đã hết hạn.", "TOKEN_INVALID");
    }

    return sendError(res, 500, "Không thể xác thực người dùng.", "AUTH_FAILED");
  }
};

export default requireAuth;
