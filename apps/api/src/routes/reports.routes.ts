import { Router } from "express";
import { pool } from "../db/pool";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query<any[]>(
      `
      SELECT
        COALESCE((SELECT SUM(actual_distance) FROM trips WHERE status = 'completed'),0) /
        NULLIF(COALESCE((SELECT SUM(fuel_consumed) FROM trips WHERE status = 'completed'),0),0) AS fuel_efficiency,

        (
          SUM(CASE WHEN status = 'on_trip' THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN status <> 'retired' THEN 1 ELSE 0 END),0)
        ) * 100 AS fleet_utilization,

        COALESCE((SELECT SUM(cost) FROM fuel_logs),0) +
        COALESCE((SELECT SUM(cost) FROM maintenance_logs),0) +
        COALESCE((SELECT SUM(amount) FROM expenses),0) AS total_operational_cost
      FROM vehicles
      `,
    );

    const [roiByVehicle] = await pool.query<any[]>(
      `
      SELECT
        v.id,
        v.registration_number,
        (
          COALESCE(SUM(t.revenue),0)
          - COALESCE((SELECT SUM(m.cost) FROM maintenance_logs m WHERE m.vehicle_id = v.id),0)
          - COALESCE((SELECT SUM(f.cost) FROM fuel_logs f WHERE f.vehicle_id = v.id),0)
        ) / NULLIF(v.acquisition_cost, 0) AS roi
      FROM vehicles v
      LEFT JOIN trips t ON t.vehicle_id = v.id
      GROUP BY v.id
      ORDER BY v.registration_number ASC
      `,
    );

    res.json({
      fuelEfficiency: Number(rows[0].fuel_efficiency || 0),
      fleetUtilization: Number(rows[0].fleet_utilization || 0),
      totalOperationalCost: Number(rows[0].total_operational_cost || 0),
      vehicleRoi: roiByVehicle,
    });
  }),
);

router.get(
  "/summary.csv",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query<any[]>(
      `
      SELECT
        v.registration_number,
        COALESCE(SUM(t.revenue),0) AS revenue,
        COALESCE((SELECT SUM(m.cost) FROM maintenance_logs m WHERE m.vehicle_id = v.id),0) AS maintenance_cost,
        COALESCE((SELECT SUM(f.cost) FROM fuel_logs f WHERE f.vehicle_id = v.id),0) AS fuel_cost,
        v.acquisition_cost
      FROM vehicles v
      LEFT JOIN trips t ON t.vehicle_id = v.id
      GROUP BY v.id
      ORDER BY v.registration_number ASC
      `,
    );

    const header = "registration_number,revenue,maintenance_cost,fuel_cost,acquisition_cost,roi";
    const lines = rows.map((row) => {
      const roi =
        (Number(row.revenue) - Number(row.maintenance_cost) - Number(row.fuel_cost)) /
        Number(row.acquisition_cost || 1);
      return [
        row.registration_number,
        row.revenue,
        row.maintenance_cost,
        row.fuel_cost,
        row.acquisition_cost,
        roi.toFixed(4),
      ].join(",");
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transitops-report.csv");
    res.send([header, ...lines].join("\n"));
  }),
);

export default router;
