import { Router } from "express";
import { body } from "express-validator";
import { pool } from "../db/pool";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { validateRequest } from "../middleware/validate";
import { AppError } from "../utils/errors";
import { ROLE } from "../utils/roles";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;
    const search = String(req.query.search || "").trim();

    const params: unknown[] = [];
    const where = search
      ? (() => {
          params.push(`%${search}%`, `%${search}%`);
          return "WHERE name LIKE ? OR license_number LIKE ?";
        })()
      : "";

    const [rows] = await pool.query<any[]>(
      `
      SELECT d.*,
      CASE
        WHEN d.license_expiry_date < CURDATE() THEN 'Expired'
        WHEN d.license_expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Expiring soon'
        ELSE 'Valid'
      END AS license_status_label
      FROM drivers d
      ${where}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    const [countRows] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total FROM drivers ${where}`,
      params,
    );

    res.json({ data: rows, page, limit, total: countRows[0].total });
  }),
);

router.get(
  "/assignable",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query<any[]>(
      `
      SELECT id, name, license_number
      FROM drivers
      WHERE status = 'available'
        AND suspended = 0
        AND license_expiry_date >= CURDATE()
      ORDER BY name ASC
      `,
    );

    res.json(rows);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await pool.query<any[]>(`SELECT * FROM drivers WHERE id = ?`, [id]);
    if (!rows.length) {
      throw new AppError(404, "Driver not found");
    }

    const [trips] = await pool.query<any[]>(
      `
      SELECT id, source, destination, status, dispatched_at, completed_at, cancelled_at
      FROM trips
      WHERE driver_id = ?
      ORDER BY created_at DESC
      `,
      [id],
    );

    res.json({ ...rows[0], trips });
  }),
);

router.post(
  "/",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER),
  body("name").isString().trim().notEmpty(),
  body("licenseNumber").isString().trim().notEmpty(),
  body("licenseCategory").isString().trim().notEmpty(),
  body("licenseExpiryDate").isISO8601(),
  body("contactNumber").isString().trim().notEmpty(),
  body("safetyScore").isFloat({ min: 0, max: 100 }),
  body("status").isIn(["available", "on_trip", "off_duty", "suspended"]),
  validateRequest,
  asyncHandler(async (req, res) => {
    const {
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore,
      status,
      suspended,
      email,
    } = req.body;

    try {
      const [result] = await pool.execute<any>(
        `
        INSERT INTO drivers
          (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status, suspended, email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          name,
          licenseNumber,
          licenseCategory,
          licenseExpiryDate,
          contactNumber,
          safetyScore,
          status,
          suspended ? 1 : 0,
          email || null,
        ],
      );

      res.status(201).json({ id: result.insertId });
    } catch (error: any) {
      if (error?.code === "ER_DUP_ENTRY") {
        throw new AppError(409, "Driver license number already exists");
      }
      throw error;
    }
  }),
);

router.put(
  "/:id",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER, ROLE.SAFETY_OFFICER),
  body("safetyScore").optional().isFloat({ min: 0, max: 100 }),
  body("status").optional().isIn(["available", "on_trip", "off_duty", "suspended"]),
  body("suspended").optional().isBoolean(),
  validateRequest,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    if (req.user!.role === ROLE.SAFETY_OFFICER) {
      const allowed = ["safetyScore", "status", "suspended"];
      const keys = Object.keys(req.body);
      if (keys.some((k) => !allowed.includes(k))) {
        throw new AppError(403, "Safety officer can update only safety fields");
      }
    }

    const {
      name,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore,
      status,
      suspended,
      email,
    } = req.body;

    const [result] = await pool.execute<any>(
      `
      UPDATE drivers
      SET
        name = COALESCE(?, name),
        license_category = COALESCE(?, license_category),
        license_expiry_date = COALESCE(?, license_expiry_date),
        contact_number = COALESCE(?, contact_number),
        safety_score = COALESCE(?, safety_score),
        status = COALESCE(?, status),
        suspended = COALESCE(?, suspended),
        email = COALESCE(?, email),
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        name,
        licenseCategory,
        licenseExpiryDate,
        contactNumber,
        safetyScore,
        status,
        suspended,
        email,
        id,
      ],
    );

    if (!result.affectedRows) {
      throw new AppError(404, "Driver not found");
    }

    res.status(204).send();
  }),
);

export default router;
