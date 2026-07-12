import { Router } from "express";
import multer from "multer";
import { body, query } from "express-validator";
import { pool } from "../db/pool";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { validateRequest } from "../middleware/validate";
import { AppError } from "../utils/errors";
import { ROLE } from "../utils/roles";

const upload = multer({ dest: "uploads/vehicles" });
const router = Router();

router.use(requireAuth);

router.get(
  "/",
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  validateRequest,
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();
    const type = String(req.query.type || "").trim();
    const region = String(req.query.region || "").trim();

    const where: string[] = [];
    const params: unknown[] = [];

    if (search) {
      where.push("(registration_number LIKE ? OR model LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (type) {
      where.push("type = ?");
      params.push(type);
    }
    if (region) {
      where.push("region = ?");
      params.push(region);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.query<any[]>(
      `
        SELECT id, registration_number, model, type, max_load_capacity, odometer,
               acquisition_cost, region, status, created_at, updated_at
        FROM vehicles
        ${whereSql}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );

    const [countRows] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total FROM vehicles ${whereSql}`,
      params,
    );

    res.json({
      data: rows,
      page,
      limit,
      total: countRows[0].total,
    });
  }),
);

router.get(
  "/assignable",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query<any[]>(
      `
        SELECT id, registration_number, model, max_load_capacity
        FROM vehicles
        WHERE status = 'available'
        ORDER BY registration_number ASC
      `,
    );

    res.json(rows);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    const [vehicleRows] = await pool.query<any[]>(
      `SELECT * FROM vehicles WHERE id = ?`,
      [id],
    );

    if (!vehicleRows.length) {
      throw new AppError(404, "Vehicle not found");
    }

    const [documents] = await pool.query<any[]>(
      `SELECT id, document_type, file_name, file_path, uploaded_at FROM vehicle_documents WHERE vehicle_id = ?`,
      [id],
    );

    const [maintenance] = await pool.query<any[]>(
      `SELECT id, maintenance_type, description, cost, status, opened_at, closed_at FROM maintenance_logs WHERE vehicle_id = ? ORDER BY opened_at DESC`,
      [id],
    );

    const [fuel] = await pool.query<any[]>(
      `SELECT id, liters, cost, log_date FROM fuel_logs WHERE vehicle_id = ? ORDER BY log_date DESC`,
      [id],
    );

    const [costRows] = await pool.query<any[]>(
      `
      SELECT
        COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = ?),0) +
        COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = ?),0) +
        COALESCE((SELECT SUM(amount) FROM expenses WHERE vehicle_id = ?),0)
        AS total_operational_cost
      `,
      [id, id, id],
    );

    const [roiRows] = await pool.query<any[]>(
      `
      SELECT
        (COALESCE((SELECT SUM(revenue) FROM trips WHERE vehicle_id = ?),0) -
        (COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = ?),0) +
         COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = ?),0))) /
        NULLIF((SELECT acquisition_cost FROM vehicles WHERE id = ?), 0) AS roi
      `,
      [id, id, id, id],
    );

    res.json({
      ...vehicleRows[0],
      documents,
      maintenance,
      fuel,
      totalOperationalCost: Number(costRows[0].total_operational_cost || 0),
      roi: Number(roiRows[0].roi || 0),
    });
  }),
);

router.post(
  "/",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER),
  body("registrationNumber").isString().trim().notEmpty(),
  body("model").isString().trim().notEmpty(),
  body("type").isString().trim().notEmpty(),
  body("maxLoadCapacity").isFloat({ gt: 0 }),
  body("odometer").isFloat({ min: 0 }),
  body("acquisitionCost").isFloat({ min: 0 }),
  body("status").isIn(["available", "on_trip", "in_shop", "retired"]),
  validateRequest,
  asyncHandler(async (req, res) => {
    const {
      registrationNumber,
      model,
      type,
      maxLoadCapacity,
      odometer,
      acquisitionCost,
      region,
      status,
    } = req.body;

    try {
      const [result] = await pool.execute<any>(
        `
          INSERT INTO vehicles
          (registration_number, model, type, max_load_capacity, odometer, acquisition_cost, region, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          registrationNumber,
          model,
          type,
          maxLoadCapacity,
          odometer,
          acquisitionCost,
          region || null,
          status,
        ],
      );

      res.status(201).json({ id: result.insertId });
    } catch (error: any) {
      if (error?.code === "ER_DUP_ENTRY") {
        throw new AppError(409, "Vehicle registration number already exists");
      }
      throw error;
    }
  }),
);

router.put(
  "/:id",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER),
  body("model").optional().isString().trim().notEmpty(),
  body("type").optional().isString().trim().notEmpty(),
  body("maxLoadCapacity").optional().isFloat({ gt: 0 }),
  body("odometer").optional().isFloat({ min: 0 }),
  body("acquisitionCost").optional().isFloat({ min: 0 }),
  body("status").optional().isIn(["available", "on_trip", "in_shop", "retired"]),
  validateRequest,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { model, type, maxLoadCapacity, odometer, acquisitionCost, region, status } =
      req.body;

    const [result] = await pool.execute<any>(
      `
        UPDATE vehicles
        SET model = COALESCE(?, model),
            type = COALESCE(?, type),
            max_load_capacity = COALESCE(?, max_load_capacity),
            odometer = COALESCE(?, odometer),
            acquisition_cost = COALESCE(?, acquisition_cost),
            region = COALESCE(?, region),
            status = COALESCE(?, status),
            updated_at = NOW()
        WHERE id = ?
      `,
      [model, type, maxLoadCapacity, odometer, acquisitionCost, region, status, id],
    );

    if (!result.affectedRows) {
      throw new AppError(404, "Vehicle not found");
    }

    res.status(204).send();
  }),
);

router.delete(
  "/:id",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const [result] = await pool.execute<any>(`DELETE FROM vehicles WHERE id = ?`, [id]);
    if (!result.affectedRows) {
      throw new AppError(404, "Vehicle not found");
    }
    res.status(204).send();
  }),
);

router.post(
  "/:id/documents",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER),
  upload.single("file"),
  body("documentType").isString().trim().notEmpty(),
  validateRequest,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!req.file) {
      throw new AppError(422, "Document file is required");
    }

    const { documentType } = req.body;
    await pool.execute(
      `
        INSERT INTO vehicle_documents (vehicle_id, document_type, file_name, file_path)
        VALUES (?, ?, ?, ?)
      `,
      [id, documentType, req.file.originalname, req.file.path],
    );

    res.status(201).json({ message: "Document uploaded" });
  }),
);

export default router;
