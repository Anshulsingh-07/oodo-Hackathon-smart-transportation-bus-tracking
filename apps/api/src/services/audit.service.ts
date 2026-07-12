import type { PoolConnection } from "mysql2/promise";

export const writeAuditLog = async (
  conn: PoolConnection,
  userId: number,
  action: string,
  entityType: string,
  entityId: number,
  details?: string,
): Promise<void> => {
  await conn.execute(
    `
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `,
    [userId, action, entityType, entityId, details ?? null],
  );
};
