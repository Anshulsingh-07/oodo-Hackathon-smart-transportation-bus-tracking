"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_validator_1 = require("express-validator");
const pool_1 = require("../db/pool");
const asyncHandler_1 = require("../middleware/asyncHandler");
const validate_1 = require("../middleware/validate");
const errors_1 = require("../utils/errors");
const jwt_1 = require("../utils/jwt");
const rateLimit_1 = require("../middleware/rateLimit");
const auth_1 = require("../middleware/auth");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
router.post("/login", rateLimit_1.loginLimiter, (0, express_validator_1.body)("email").isEmail().normalizeEmail(), (0, express_validator_1.body)("password").isLength({ min: 8 }), validate_1.validateRequest, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await pool_1.pool.execute(`
        SELECT u.id, u.full_name, u.email, u.password_hash, r.name AS role
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.email = ? AND u.active = 1
      `, [email]);
    const user = rows[0];
    if (!user) {
        throw new errors_1.AppError(401, "Invalid email or password");
    }
    const match = await bcrypt_1.default.compare(password, user.password_hash);
    if (!match) {
        throw new errors_1.AppError(401, "Invalid email or password");
    }
    const payload = {
        userId: user.id,
        role: user.role,
        email: user.email,
        fullName: user.full_name,
    };
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)(payload);
    await pool_1.pool.execute(`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`, [user.id, refreshToken]);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: env_1.env.NODE_ENV === "production",
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
}));
router.post("/refresh", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
        throw new errors_1.AppError(401, "Refresh token is missing");
    }
    let claims;
    try {
        claims = (0, jwt_1.verifyRefreshToken)(token);
    }
    catch {
        throw new errors_1.AppError(401, "Invalid refresh token");
    }
    const [rows] = await pool_1.pool.execute(`SELECT id FROM refresh_tokens WHERE token = ? AND revoked_at IS NULL AND expires_at > NOW()`, [token]);
    if (!rows.length) {
        throw new errors_1.AppError(401, "Refresh token is not valid");
    }
    const accessToken = (0, jwt_1.signAccessToken)(claims);
    res.json({ accessToken });
}));
router.post("/logout", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token) {
        await pool_1.pool.execute(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = ?`, [
            token,
        ]);
    }
    res.clearCookie("refreshToken");
    res.status(204).send();
}));
router.get("/me", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const [rows] = await pool_1.pool.execute(`
        SELECT u.id, u.full_name, u.email, r.name AS role
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = ?
      `, [req.user.userId]);
    if (!rows.length) {
        throw new errors_1.AppError(404, "User not found");
    }
    res.json(rows[0]);
}));
exports.default = router;
