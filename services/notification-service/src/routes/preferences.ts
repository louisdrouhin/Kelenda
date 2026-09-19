import { Router } from 'express';
import { pool } from '../db';
import { NOTIFIABLE_EVENT_TYPES } from '../event-types';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

const VALID_CHANNELS = ['web_push', 'email'];

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT event_type, channel, enabled
     FROM notification_preferences
     WHERE user_id = $1
     ORDER BY event_type ASC, channel ASC`,
    [req.auth!.sub]
  );

  return res.status(200).json(result.rows);
});

router.patch('/', requireAuth, async (req, res) => {
  const { event_type, channel, enabled } = req.body ?? {};

  if (!NOTIFIABLE_EVENT_TYPES.includes(event_type)) {
    return res.status(400).json({ error: `event_type doit être l'un de : ${NOTIFIABLE_EVENT_TYPES.join(', ')}` });
  }
  if (!VALID_CHANNELS.includes(channel)) {
    return res.status(400).json({ error: `channel doit être l'un de : ${VALID_CHANNELS.join(', ')}` });
  }
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled doit être un booléen' });
  }

  const result = await pool.query(
    `INSERT INTO notification_preferences (user_id, event_type, channel, enabled)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, event_type, channel) DO UPDATE SET enabled = EXCLUDED.enabled
     RETURNING event_type, channel, enabled`,
    [req.auth!.sub, event_type, channel, enabled]
  );

  return res.status(200).json(result.rows[0]);
});

export { router as preferencesRouter };
