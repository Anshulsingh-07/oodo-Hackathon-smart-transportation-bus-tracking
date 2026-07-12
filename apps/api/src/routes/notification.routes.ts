import { Router } from "express";
import { pool } from "../db/pool";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query<any[]>(
      `
      SELECT id, message, created_at, read_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 25
      `,
      [req.user!.userId],
    );

    res.json(rows);
  }),
);

router.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    await pool.execute(
      `UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?`,
      [Number(req.params.id), req.user!.userId],
    );

    res.status(204).send();
  }),
);

export default router;
