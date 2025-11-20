import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

const ACCESS_SECRET: Secret = env.ACCESS_TOKEN_SECRET as Secret;
const REFRESH_SECRET: Secret = env.REFRESH_TOKEN_SECRET as Secret;

type JwtExpires = string | number;

const buildOptions = (expiresIn: JwtExpires): SignOptions =>
  ({ expiresIn } as SignOptions);

export const signAccessToken = (userId: string): string =>
  jwt.sign(
    { userId },
    ACCESS_SECRET,
    buildOptions(env.ACCESS_TOKEN_EXPIRES_IN as JwtExpires)
  );

export const signRefreshToken = (userId: string): string =>
  jwt.sign(
    { userId },
    REFRESH_SECRET,
    buildOptions(env.REFRESH_TOKEN_EXPIRES_IN as JwtExpires)
  );

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
};
