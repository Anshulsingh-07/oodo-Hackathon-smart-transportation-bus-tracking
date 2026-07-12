import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many login attempts. Try again later." },
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  message: { message: "Too many requests. Try again later." },
});
