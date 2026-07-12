import nodemailer from "nodemailer";
import { env } from "../config/env";
import { pool } from "../db/pool";

const hasSmtp = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

export const createNotification = async (
  userId: number,
  message: string,
): Promise<void> => {
  await pool.execute(
    `INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
    [userId, message],
  );
};

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
): Promise<void> => {
  if (!transporter || !env.SMTP_FROM) {
    return;
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
  });
};
