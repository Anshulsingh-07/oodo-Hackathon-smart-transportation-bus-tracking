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
  asyncHandler(async (req, res) => {
    const status = String(req.query.status || "").trim();
    const search = String(req.query.search || "").trim();

    const where: string[] = [];
    const params: unknown[] = [];
    if (status) {
      where.push("t.status = ?");
      params.push(status);
    }
    if (search) {
      where.push("(t.source LIKE ? OR t.destination LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.query<any[]>(
      `
      SELECT t.*, v.registration_number, d.name AS driver_name
      FROM trips t
      JOIN vehicles v ON v.id = t.vehicle_id
      JOIN drivers d ON d.id = t.driver_id
      ${whereSql}
      ORDER BY t.created_at DESC
      `,
      params,
    );

    res.json(rows);
  }),
);

router.post(
  "/",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER, ROLE.DISPATCHER),
  body("source").isString().trim().notEmpty(),
  body("destination").isString().trim().notEmpty(),
  body("vehicleId").isInt({ min: 1 }),
  body("driverId").isInt({ min: 1 }),
  body("cargoWeight").isFloat({ gt: 0 }),
  body("plannedDistance").isFloat({ gt: 0 }),
  body("revenue").optional().isFloat({ min: 0 }),
  validateRequest,
  asyncHandler(async (req, res) => {
    const {
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeight,
      plannedDistance,
      revenue,
    } = req.body;

    const [vehicleRows] = await pool.query<any[]>(
      `
      SELECT id, max_load_capacity, status
      FROM vehicles
      WHERE id = ?
      `,
      [vehicleId],
    );

    if (!vehicleRows.length) {
      throw new AppError(404, "Vehicle not found");
    }

    const vehicle = vehicleRows[0];
    if (vehicle.status !== "available") {
      throw new AppError(409, "Vehicle is not available for trip assignment");
    }
    if (Number(cargoWeight) > Number(vehicle.max_load_capacity)) {
      throw new AppError(
        422,
        "Cargo weight exceeds vehicle maximum load capacity",
      );
    }

    const [driverRows] = await pool.query<any[]>(
      `
      SELECT id, status, suspended, license_expiry_date
      FROM drivers
      WHERE id = ?
      `,
      [driverId],
    );

    if (!driverRows.length) {
      throw new AppError(404, "Driver not found");
    }

    const driver = driverRows[0];
    const expired = new Date(driver.license_expiry_date) < new Date();
    if (driver.status !== "available" || driver.suspended || expired) {
      throw new AppError(409, "Driver is not eligible for trip assignment");
    }

    const [result] = await pool.execute<any>(
      `
      INSERT INTO trips
      (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
      `,
      [source, destination, vehicleId, driverId, cargoWeight, plannedDistance, revenue || 0],
    );

    res.status(201).json({ id: result.insertId });
  }),
);

router.post(
  "/:id/dispatch",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER, ROLE.DISPATCHER),
  asyncHandler(async (req, res) => {
    const tripId = Number(req.params.id);
    const userId = req.user!.userId;

    await withTransaction(async (conn) => {
      const [tripRows] = await conn.query<any[]>(
        `
        SELECT id, vehicle_id, driver_id, status, cargo_weight
        FROM trips
        WHERE id = ?
        FOR UPDATE
        `,
        [tripId],
      );

      if (!tripRows.length) {
        throw new AppError(404, "Trip not found");
      }

      const trip = tripRows[0];
      if (trip.status !== "draft") {
        throw new AppError(409, "Only draft trips can be dispatched");
      }

      const [vehicleRows] = await conn.query<any[]>(
        `SELECT id, status, max_load_capacity FROM vehicles WHERE id = ? FOR UPDATE`,
        [trip.vehicle_id],
      );

      const [driverRows] = await conn.query<any[]>(
        `
        SELECT id, status, suspended, license_expiry_date
        FROM drivers
        WHERE id = ?
        FOR UPDATE
        `,
        [trip.driver_id],
      );

      const vehicle = vehicleRows[0];
      const driver = driverRows[0];

      if (!vehicle || !driver) {
        throw new AppError(409, "Trip has invalid vehicle or driver");
      }

      if (vehicle.status !== "available") {
        throw new AppError(409, "Vehicle is no longer available");
      }

      const expired = new Date(driver.license_expiry_date) < new Date();
      if (driver.status !== "available" || driver.suspended || expired) {
        throw new AppError(409, "Driver is no longer eligible");
      }

      if (Number(trip.cargo_weight) > Number(vehicle.max_load_capacity)) {
        throw new AppError(422, "Cargo weight exceeds vehicle capacity");
      }

      await conn.execute(
        `UPDATE trips SET status = 'dispatched', dispatched_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [tripId],
      );
      await conn.execute(
        `UPDATE vehicles SET status = 'on_trip', updated_at = NOW() WHERE id = ?`,
        [trip.vehicle_id],
      );
      await conn.execute(
        `UPDATE drivers SET status = 'on_trip', updated_at = NOW() WHERE id = ?`,
        [trip.driver_id],
      );

      await writeAuditLog(
        conn,
        userId,
        "trip_dispatch",
        "trip",
        tripId,
        "Trip dispatched and linked vehicle/driver moved to on_trip",
      );
    });

    res.status(204).send();
  }),
);

router.post(
  "/:id/complete",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER, ROLE.DISPATCHER),
  body("actualDistance").isFloat({ gt: 0 }),
  body("fuelConsumed").isFloat({ gt: 0 }),
  body("finalOdometer").isFloat({ gt: 0 }),
  validateRequest,
  asyncHandler(async (req, res) => {
    const tripId = Number(req.params.id);
    const { actualDistance, fuelConsumed, finalOdometer } = req.body;
    const userId = req.user!.userId;

    await withTransaction(async (conn) => {
      const [tripRows] = await conn.query<any[]>(
        `
        SELECT id, vehicle_id, driver_id, status
        FROM trips
        WHERE id = ?
        FOR UPDATE
        `,
        [tripId],
      );

      if (!tripRows.length) {
        throw new AppError(404, "Trip not found");
      }

      const trip = tripRows[0];
      if (trip.status !== "dispatched") {
        throw new AppError(409, "Only dispatched trips can be completed");
      }

      const [vehicleRows] = await conn.query<any[]>(
        `SELECT id, odometer, status FROM vehicles WHERE id = ? FOR UPDATE`,
        [trip.vehicle_id],
      );
      const [driverRows] = await conn.query<any[]>(
        `SELECT id, status FROM drivers WHERE id = ? FOR UPDATE`,
        [trip.driver_id],
      );

      if (!vehicleRows.length || !driverRows.length) {
        throw new AppError(409, "Trip has missing vehicle or driver");
      }

      if (Number(finalOdometer) < Number(vehicleRows[0].odometer)) {
        throw new AppError(422, "Final odometer cannot be lower than current odometer");
      }

      await conn.execute(
        `
        UPDATE trips
        SET status = 'completed', actual_distance = ?, fuel_consumed = ?, completed_at = NOW(), updated_at = NOW()
        WHERE id = ?
        `,
        [actualDistance, fuelConsumed, tripId],
      );
      await conn.execute(
        `UPDATE vehicles SET status = 'available', odometer = ?, updated_at = NOW() WHERE id = ?`,
        [finalOdometer, trip.vehicle_id],
      );
      await conn.execute(
        `UPDATE drivers SET status = 'available', updated_at = NOW() WHERE id = ?`,
        [trip.driver_id],
      );

      await writeAuditLog(
        conn,
        userId,
        "trip_complete",
        "trip",
        tripId,
        "Trip completed and linked resources restored to available",
      );
    });

    res.status(204).send();
  }),
);

router.post(
  "/:id/cancel",
  requireRole(ROLE.ADMIN, ROLE.FLEET_MANAGER, ROLE.DISPATCHER),
  asyncHandler(async (req, res) => {
    const tripId = Number(req.params.id);
    const userId = req.user!.userId;

    await withTransaction(async (conn) => {
      const [tripRows] = await conn.query<any[]>(
        `
        SELECT id, vehicle_id, driver_id, status
        FROM trips
        WHERE id = ?
        FOR UPDATE
        `,
        [tripId],
      );

      if (!tripRows.length) {
        throw new AppError(404, "Trip not found");
      }

      const trip = tripRows[0];
      if (trip.status !== "dispatched") {
        throw new AppError(409, "Only dispatched trips can be cancelled");
      }

      await conn.execute(
        `UPDATE trips SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [tripId],
      );
      await conn.execute(
        `UPDATE vehicles SET status = 'available', updated_at = NOW() WHERE id = ? AND status = 'on_trip'`,
        [trip.vehicle_id],
      );
      await conn.execute(
        `UPDATE drivers SET status = 'available', updated_at = NOW() WHERE id = ? AND status = 'on_trip'`,
        [trip.driver_id],
      );

      await writeAuditLog(
        conn,
        userId,
        "trip_cancel",
        "trip",
        tripId,
        "Trip cancelled and linked resources restored to available",
      );
    });

    res.status(204).send();
  }),
);

export default router;
