import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../utils/errors";

export const validateRequest = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const message = result
      .array()
      .map((item) => item.msg)
      .join(", ");
    return next(new AppError(422, message));
  }

  return next();
};
