import { Router } from "express";
import { body } from "express-validator";
import { pool } from "../db/pool";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { validateRequest } from "../middleware/validate";
import { ROLE } from "../utils/roles";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [fuel] = await pool.query<any[]>(
      `
      SELECT fl.*, v.registration_number
      FROM fuel_logs fl
      JOIN vehicles v ON v.id = fl.vehicle_id
      ORDER BY fl.log_date DESC
      `,
    );

    const [expenses] = await pool.query<any[]>(
      `
      SELECT e.*, v.registration_number
      FROM expenses e
      JOIN vehicles v ON v.id = e.vehicle_id
      ORDER BY e.expense_date DESC
      `,
    );

    res.json({ fuel, expenses });
  }),
);

router.post(
  "/fuel",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER, ROLE.DISPATCHER),
  body("vehicleId").isInt({ min: 1 }),
  body("tripId").optional().isInt({ min: 1 }),
  body("liters").isFloat({ gt: 0 }),
  body("cost").isFloat({ min: 0 }),
  body("logDate").isISO8601(),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { vehicleId, tripId, liters, cost, logDate } = req.body;
    await pool.execute(
      `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date) VALUES (?, ?, ?, ?, ?)`,
      [vehicleId, tripId || null, liters, cost, logDate],
    );
    res.status(201).json({ message: "Fuel log added" });
  }),
);

router.post(
  "/expenses",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER),
  body("vehicleId").isInt({ min: 1 }),
  body("tripId").optional().isInt({ min: 1 }),
  body("category").isIn(["toll", "maintenance", "fine", "insurance", "other"]),
  body("amount").isFloat({ min: 0 }),
  body("expenseDate").isISO8601(),
  body("notes").optional().isString(),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { vehicleId, tripId, category, amount, expenseDate, notes } = req.body;
    await pool.execute(
      `
      INSERT INTO expenses (vehicle_id, trip_id, category, amount, expense_date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [vehicleId, tripId || null, category, amount, expenseDate, notes || null],
    );

    res.status(201).json({ message: "Expense added" });
  }),
);

export default router;
