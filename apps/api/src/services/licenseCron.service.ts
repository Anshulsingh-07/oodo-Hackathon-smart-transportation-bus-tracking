import cron from "node-cron";
import { env } from "../config/env";
import { pool } from "../db/pool";
import { createNotification, sendEmail } from "./notification.service";
import { logger } from "../config/logger";

export const startLicenseCron = (): void => {
  cron.schedule(env.LICENSE_CHECK_CRON, async () => {
    try {
      const [rows] = await pool.query<any[]>(
        `
          SELECT id, name, contact_number, email, license_expiry_date
          FROM drivers
          WHERE license_expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        `,
      );

      const [safetyUsers] = await pool.query<any[]>(
        `
          SELECT u.id, u.email
          FROM users u
          JOIN roles r ON r.id = u.role_id
          WHERE r.name IN ('admin', 'safety_officer') AND u.active = 1
        `,
      );

      for (const driver of rows) {
        const expiry = new Date(driver.license_expiry_date);
        const expired = expiry < new Date();
        const label = expired ? "expired" : "expiring within 30 days";
        const message = `Driver ${driver.name} license is ${label} (${driver.license_expiry_date}).`;

        for (const user of safetyUsers) {
          await createNotification(user.id, message);
          await sendEmail(user.email, "TransitOps license alert", message);
        }

        if (driver.email) {
          await sendEmail(driver.email, "Your license status", message);
        }
      }
    } catch (error) {
      logger.error("License cron failed", error);
    }
  });
};
