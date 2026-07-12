import { Router } from "express";
import bcrypt from "bcrypt";
import { body } from "express-validator";
import { pool } from "../db/pool";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateRequest } from "../middleware/validate";
import { AppError } from "../utils/errors";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { loginLimiter } from "../middleware/rateLimit";
import { requireAuth } from "../middleware/auth";
import { env } from "../config/env";

const router = Router();

router.post(
  "/login",
  loginLimiter,
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const [rows] = await pool.execute<any[]>(
      `
        SELECT u.id, u.full_name, u.email, u.password_hash, r.name AS role
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.email = ? AND u.active = 1
      `,
      [email],
    );

    const user = rows[0];
    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new AppError(401, "Invalid email or password");
    }

    const payload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      fullName: user.full_name,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await pool.execute(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [user.id, refreshToken],
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      throw new AppError(401, "Refresh token is missing");
    }

    let claims;
    try {
      claims = verifyRefreshToken(token);
    } catch {
      throw new AppError(401, "Invalid refresh token");
    }

    const [rows] = await pool.execute<any[]>(
      `SELECT id FROM refresh_tokens WHERE token = ? AND revoked_at IS NULL AND expires_at > NOW()`,
      [token],
    );

    if (!rows.length) {
      throw new AppError(401, "Refresh token is not valid");
    }

    const accessToken = signAccessToken(claims);
    res.json({ accessToken });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token) {
      await pool.execute(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = ?`, [
        token,
      ]);
    }

    res.clearCookie("refreshToken");
    res.status(204).send();
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [rows] = await pool.execute<any[]>(
      `
        SELECT u.id, u.full_name, u.email, r.name AS role
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = ?
      `,
      [req.user!.userId],
    );

    if (!rows.length) {
      throw new AppError(404, "User not found");
    }

    res.json(rows[0]);
  }),
);

export default router;
