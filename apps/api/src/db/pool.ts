import mysql, { type PoolConnection } from "mysql2/promise";
import { env } from "../config/env";

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 12,
  timezone: "Z",
});

export const withTransaction = async <T>(
  handler: (conn: PoolConnection) => Promise<T>,
): Promise<T> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await handler(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};
