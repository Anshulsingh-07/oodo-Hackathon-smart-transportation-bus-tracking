export type RoleName =
  | "admin"
  | "fleet_manager"
  | "dispatcher"
  | "safety_officer"
  | "financial_analyst";

export type User = {
  id: number;
  full_name?: string;
  fullName?: string;
  email: string;
  role: RoleName;
};

export type Vehicle = {
  id: number;
  registration_number: string;
  model: string;
  type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  region: string | null;
  status: "available" | "on_trip" | "in_shop" | "retired";
};

export type Driver = {
  id: number;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: "available" | "on_trip" | "off_duty" | "suspended";
  suspended: number;
  license_status_label: "Valid" | "Expired" | "Expiring soon";
};

export type Trip = {
  id: number;
  source: string;
  destination: string;
  status: "draft" | "dispatched" | "completed" | "cancelled";
  vehicle_id: number;
  driver_id: number;
  registration_number: string;
  driver_name: string;
  cargo_weight: number;
};
