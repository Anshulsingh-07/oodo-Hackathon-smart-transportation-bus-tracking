import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import type { RoleName } from "../utils/roles";

export const requireRole =
  (...roles: RoleName[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "You are not allowed to perform this action"));
    }

    return next();
  };
