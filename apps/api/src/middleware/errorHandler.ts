import type { NextFunction, Request, Response } from "express";
import { isAppError } from "../utils/errors";
import { logger } from "../config/logger";

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (isAppError(err)) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({ message: "Internal server error" });
};
