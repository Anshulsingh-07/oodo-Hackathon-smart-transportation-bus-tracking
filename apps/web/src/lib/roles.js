export const canManageVehicles = (role) => role === "admin" || role === "fleet_manager";
export const canManageDrivers = (role) => role === "admin" || role === "fleet_manager" || role === "safety_officer";
export const canCreateTrips = (role) => role === "admin" || role === "fleet_manager" || role === "dispatcher";
export const canManageMaintenance = (role) => role === "admin" || role === "fleet_manager";
export const canLogFuel = (role) => role === "admin" || role === "fleet_manager" || role === "dispatcher";
export const canLogExpenses = (role) => role === "admin" || role === "fleet_manager";
