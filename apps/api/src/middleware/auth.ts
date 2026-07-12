import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { verifyAccessToken } from "../utils/jwt";

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const raw = req.headers.authorization;
  if (!raw || !raw.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required"));
  }

  try {
    const claims = verifyAccessToken(raw.slice(7));
    req.user = claims;
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired access token"));
  }
};
