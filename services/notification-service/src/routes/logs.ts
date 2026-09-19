import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, event_type, channel, status, created_at, sent_at
     FROM notification_logs
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.auth!.sub]
  );

  return res.status(200).json(result.rows);
});

export { router as logsRouter };
