import type { RoleName } from "../utils/roles";

declare global {
  namespace Express {
    interface UserClaims {
      userId: number;
      role: RoleName;
      email: string;
      fullName: string;
    }

    interface Request {
      user?: UserClaims;
    }
  }
}

export {};
