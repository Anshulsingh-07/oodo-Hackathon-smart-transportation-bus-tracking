export const ROLE = {
  ADMIN: "admin",
  FLEET_MANAGER: "fleet_manager",
  DISPATCHER: "dispatcher",
  SAFETY_OFFICER: "safety_officer",
  FINANCIAL_ANALYST: "financial_analyst",
} as const;

export type RoleName = (typeof ROLE)[keyof typeof ROLE];
