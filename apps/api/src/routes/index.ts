import { Router } from "express";
import authRoutes from "./auth.routes";
import dashboardRoutes from "./dashboard.routes";
import driverRoutes from "./driver.routes";
import fuelExpenseRoutes from "./fuelExpense.routes";
import maintenanceRoutes from "./maintenance.routes";
import notificationRoutes from "./notification.routes";
import reportsRoutes from "./reports.routes";
import tripRoutes from "./trip.routes";
import vehicleRoutes from "./vehicle.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/drivers", driverRoutes);
router.use("/trips", tripRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/costs", fuelExpenseRoutes);
router.use("/reports", reportsRoutes);
router.use("/notifications", notificationRoutes);

export default router;