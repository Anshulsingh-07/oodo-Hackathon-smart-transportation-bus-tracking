import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { RoleName } from "./roles";

type AccessPayload = {
  userId: number;
  role: RoleName;
  email: string;
  fullName: string;
};

export const signAccessToken = (payload: AccessPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"],
  });

export const signRefreshToken = (payload: AccessPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL as jwt.SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string): AccessPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;

export const verifyRefreshToken = (token: string): AccessPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessPayload;
