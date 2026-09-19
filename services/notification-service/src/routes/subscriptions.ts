import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { endpoint, keys } = req.body ?? {};
  const p256dh = keys?.p256dh;
  const auth = keys?.auth;

  if (typeof endpoint !== 'string' || endpoint.trim() === '') {
    return res.status(400).json({ error: 'endpoint est requis' });
  }
  if (typeof p256dh !== 'string' || typeof auth !== 'string') {
    return res.status(400).json({ error: 'keys.p256dh et keys.auth sont requis' });
  }

  const result = await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET p256dh_key = EXCLUDED.p256dh_key, auth_key = EXCLUDED.auth_key
     RETURNING id, user_id, endpoint, created_at, last_used_at`,
    [req.auth!.sub, endpoint, p256dh, auth]
  );

  return res.status(201).json(result.rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const result = await pool.query('DELETE FROM push_subscriptions WHERE id = $1 AND user_id = $2 RETURNING id', [
    req.params.id,
    req.auth!.sub,
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Abonnement introuvable' });
  }

  return res.status(204).send();
});

export { router as subscriptionsRouter };
