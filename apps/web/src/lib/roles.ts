import type { RoleName } from "../types/app";

export const canManageVehicles = (role?: RoleName): boolean =>
  role === "admin" || role === "fleet_manager";

export const canManageDrivers = (role?: RoleName): boolean =>
  role === "admin" || role === "fleet_manager" || role === "safety_officer";

export const canCreateTrips = (role?: RoleName): boolean =>
  role === "admin" || role === "fleet_manager" || role === "dispatcher";

export const canManageMaintenance = (role?: RoleName): boolean =>
  role === "admin" || role === "fleet_manager";

export const canLogFuel = (role?: RoleName): boolean =>
  role === "admin" || role === "fleet_manager" || role === "dispatcher";

export const canLogExpenses = (role?: RoleName): boolean =>
  role === "admin" || role === "fleet_manager";
