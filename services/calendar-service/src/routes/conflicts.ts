import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

const VALID_STATUSES = ['open', 'resolved', 'dismissed'];

router.get('/', requireAuth, async (req, res) => {
  const { status } = req.query;

  if (status !== undefined && (typeof status !== 'string' || !VALID_STATUSES.includes(status))) {
    return res.status(400).json({ error: `status doit être l'un de : ${VALID_STATUSES.join(', ')}` });
  }

  const result = await pool.query(
    `SELECT dc.id, dc.status, dc.detected_at, dc.resolved_at,
            dc.event_a_id, ea.title AS event_a_title, ea.start_at AS event_a_start_at,
            dc.event_b_id, eb.title AS event_b_title, eb.start_at AS event_b_start_at
     FROM detected_conflicts dc
     JOIN events ea ON ea.id = dc.event_a_id
     JOIN events eb ON eb.id = dc.event_b_id
     JOIN calendar_sources sa ON sa.id = ea.source_id
     WHERE sa.user_id = $1
       AND ($2::text IS NULL OR dc.status = $2)
     ORDER BY dc.detected_at DESC`,
    [req.auth!.sub, status ?? null]
  );

  return res.status(200).json(result.rows);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { status } = req.body ?? {};

  if (typeof status !== 'string' || !['resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: "status doit être 'resolved' ou 'dismissed'" });
  }

  const result = await pool.query(
    `UPDATE detected_conflicts dc
     SET status = $3, resolved_at = now()
     FROM events ea
     JOIN calendar_sources sa ON sa.id = ea.source_id
     WHERE dc.id = $1
       AND dc.event_a_id = ea.id
       AND sa.user_id = $2
     RETURNING dc.id, dc.status, dc.detected_at, dc.resolved_at, dc.event_a_id, dc.event_b_id`,
    [req.params.id, req.auth!.sub, status]
  );

  const conflict = result.rows[0];
  if (!conflict) {
    return res.status(404).json({ error: 'Conflit introuvable' });
  }

  return res.status(200).json(conflict);
});

export { router as conflictsRouter };
