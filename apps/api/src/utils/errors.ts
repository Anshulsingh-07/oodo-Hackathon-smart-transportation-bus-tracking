export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const isAppError = (err: unknown): err is AppError =>
  err instanceof AppError;
