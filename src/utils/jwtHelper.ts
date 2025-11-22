import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "../models/User";

export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

const ACCESS_SECRET = env.ACCESS_TOKEN_SECRET as string;
const REFRESH_SECRET = env.REFRESH_TOKEN_SECRET as string;

type JwtExpires = string | number;

const buildOptions = (expiresIn: JwtExpires) => ({ expiresIn });

export const signAccessToken = (userId: string, role: UserRole): string =>
  jwt.sign(
    { userId, role },
    ACCESS_SECRET,
    buildOptions(env.ACCESS_TOKEN_EXPIRES_IN as JwtExpires)
  );

export const signRefreshToken = (userId: string, role: UserRole): string =>
  jwt.sign(
    { userId, role },
    REFRESH_SECRET,
    buildOptions(env.REFRESH_TOKEN_EXPIRES_IN as JwtExpires)
  );

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
};


