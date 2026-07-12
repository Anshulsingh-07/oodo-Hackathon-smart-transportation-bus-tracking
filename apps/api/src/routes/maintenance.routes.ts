import { Router } from "express";
import { body } from "express-validator";
import { pool, withTransaction } from "../db/pool";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { validateRequest } from "../middleware/validate";
import { AppError } from "../utils/errors";
import { ROLE } from "../utils/roles";
import { writeAuditLog } from "../services/audit.service";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query<any[]>(
      `
      SELECT m.*, v.registration_number
      FROM maintenance_logs m
      JOIN vehicles v ON v.id = m.vehicle_id
      ORDER BY m.opened_at DESC
      `,
    );

    res.json(rows);
  }),
);

router.post(
  "/",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER),
  body("vehicleId").isInt({ min: 1 }),
  body("maintenanceType").isString().trim().notEmpty(),
  body("description").isString().trim().notEmpty(),
  body("cost").isFloat({ min: 0 }),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { vehicleId, maintenanceType, description, cost } = req.body;

    await withTransaction(async (conn) => {
      const [openRows] = await conn.query<any[]>(
        `SELECT id FROM maintenance_logs WHERE vehicle_id = ? AND status = 'open' FOR UPDATE`,
        [vehicleId],
      );
      if (openRows.length) {
        throw new AppError(409, "Only one open maintenance record is allowed per vehicle");
      }

      const [vehicleRows] = await conn.query<any[]>(
        `SELECT id, status FROM vehicles WHERE id = ? FOR UPDATE`,
        [vehicleId],
      );
      if (!vehicleRows.length) {
        throw new AppError(404, "Vehicle not found");
      }

      const [result] = await conn.execute<any>(
        `
          INSERT INTO maintenance_logs (vehicle_id, maintenance_type, description, cost, status, opened_at)
          VALUES (?, ?, ?, ?, 'open', NOW())
        `,
        [vehicleId, maintenanceType, description, cost],
      );

      await conn.execute(
        `UPDATE vehicles SET status = 'in_shop', updated_at = NOW() WHERE id = ? AND status <> 'retired'`,
        [vehicleId],
      );

      await writeAuditLog(
        conn,
        req.user!.userId,
        "maintenance_open",
        "maintenance",
        result.insertId,
        "Maintenance opened and vehicle moved to in_shop",
      );
    });

    res.status(201).json({ message: "Maintenance record created" });
  }),
);

router.post(
  "/:id/close",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    await withTransaction(async (conn) => {
      const [rows] = await conn.query<any[]>(
        `SELECT id, vehicle_id, status FROM maintenance_logs WHERE id = ? FOR UPDATE`,
        [id],
      );
      if (!rows.length) {
        throw new AppError(404, "Maintenance record not found");
      }

      const maintenance = rows[0];
      if (maintenance.status !== "open") {
        throw new AppError(409, "Only open maintenance records can be closed");
      }

      await conn.execute(
        `
        UPDATE maintenance_logs
        SET status = 'closed', closed_at = NOW(), updated_at = NOW()
        WHERE id = ?
        `,
        [id],
      );

      await conn.execute(
        `
        UPDATE vehicles
        SET status = CASE WHEN status = 'retired' THEN 'retired' ELSE 'available' END,
            updated_at = NOW()
        WHERE id = ?
        `,
        [maintenance.vehicle_id],
      );

      await writeAuditLog(
        conn,
        req.user!.userId,
        "maintenance_close",
        "maintenance",
        id,
        "Maintenance closed and vehicle restored",
      );
    });

    res.status(204).send();
  }),
);

export default router;
