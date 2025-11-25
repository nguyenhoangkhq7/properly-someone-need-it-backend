import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwtHelper";
import { sendError } from "../utils/response";

const AUTH_HEADER_PREFIX = "bearer";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    return sendError(
      res,
      401,
      "Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ tiáº¿p tá»¥c.",
      "AUTH_REQUIRED"
    );
  }

  const [scheme, token] = header.split(" ");
  if (!token || !scheme || scheme.toLowerCase() !== AUTH_HEADER_PREFIX) {
    return sendError(res, 401, "Token khÃ´ng há»£p lá»‡.", "TOKEN_INVALID");
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    req.userRole = payload.role;
    return next();
  } catch (error) {
    const isJwtError =
      error instanceof Error &&
      (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError");

    if (isJwtError) {
      return sendError(
        res,
        401,
        "Token khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n.",
        "TOKEN_INVALID"
      );
    }

    return sendError(
      res,
      500,
      "KhÃ´ng thá»ƒ xÃ¡c thá»±c ngÆ°á»i dÃ¹ng.",
      "AUTH_FAILED"
    );
  }
};

export default requireAuth;
