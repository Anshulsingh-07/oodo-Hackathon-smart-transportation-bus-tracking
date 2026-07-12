import { Router } from "express";
import { pool } from "../db/pool";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const type = String(req.query.type || "").trim();
    const status = String(req.query.status || "").trim();
    const region = String(req.query.region || "").trim();

    const where: string[] = [];
    const params: unknown[] = [];

    if (type) {
      where.push("type = ?");
      params.push(type);
    }
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (region) {
      where.push("region = ?");
      params.push(region);
    }

    const sqlWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [vehicleStats] = await pool.query<any[]>(
      `
      SELECT
        SUM(CASE WHEN status <> 'retired' THEN 1 ELSE 0 END) AS active_vehicles,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_vehicles,
        SUM(CASE WHEN status = 'in_shop' THEN 1 ELSE 0 END) AS in_maintenance,
        SUM(CASE WHEN status = 'on_trip' THEN 1 ELSE 0 END) AS on_trip
      FROM vehicles
      ${sqlWhere}
      `,
      params,
    );

    const [tripStats] = await pool.query<any[]>(
      `
      SELECT
        SUM(CASE WHEN status = 'dispatched' THEN 1 ELSE 0 END) AS active_trips,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_trips
      FROM trips
      `,
    );

    const [driverStats] = await pool.query<any[]>(
      `
      SELECT SUM(CASE WHEN status IN ('available','on_trip') THEN 1 ELSE 0 END) AS on_duty
      FROM drivers
      `,
    );

    const activeVehicles = Number(vehicleStats[0].active_vehicles || 0);
    const onTripVehicles = Number(vehicleStats[0].on_trip || 0);
    const utilization = activeVehicles
      ? Number(((onTripVehicles / activeVehicles) * 100).toFixed(2))
      : 0;

    const [tripStatusDistribution] = await pool.query<any[]>(
      `SELECT status, COUNT(*) AS count FROM trips GROUP BY status`,
    );

    const [costBreakdown] = await pool.query<any[]>(
      `
      SELECT 'fuel' AS bucket, COALESCE(SUM(cost),0) AS amount FROM fuel_logs
      UNION ALL
      SELECT 'maintenance' AS bucket, COALESCE(SUM(cost),0) AS amount FROM maintenance_logs
      UNION ALL
      SELECT 'expense' AS bucket, COALESCE(SUM(amount),0) AS amount FROM expenses
      `,
    );

    res.json({
      kpis: {
        activeVehicles,
        availableVehicles: Number(vehicleStats[0].available_vehicles || 0),
        inMaintenance: Number(vehicleStats[0].in_maintenance || 0),
        activeTrips: Number(tripStats[0].active_trips || 0),
        draftTrips: Number(tripStats[0].draft_trips || 0),
        onDutyDrivers: Number(driverStats[0].on_duty || 0),
        utilization,
      },
      charts: {
        tripStatusDistribution,
        costBreakdown,
      },
    });
  }),
);

export default router;
