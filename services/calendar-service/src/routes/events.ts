import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

const VALID_CATEGORIES = ['ecole', 'entreprise', 'personnel'];

router.get('/', requireAuth, async (req, res) => {
  const { from, to, category } = req.query;

  if (category !== undefined && (typeof category !== 'string' || !VALID_CATEGORIES.includes(category))) {
    return res.status(400).json({ error: `category doit être l'un de : ${VALID_CATEGORIES.join(', ')}` });
  }
  if (from !== undefined && (typeof from !== 'string' || Number.isNaN(Date.parse(from)))) {
    return res.status(400).json({ error: 'from doit être une date ISO valide' });
  }
  if (to !== undefined && (typeof to !== 'string' || Number.isNaN(Date.parse(to)))) {
    return res.status(400).json({ error: 'to doit être une date ISO valide' });
  }

  const result = await pool.query(
    `SELECT e.id, e.source_id, e.title, e.description, e.location, e.start_at, e.end_at,
            e.all_day, e.category, e.created_at, e.updated_at
     FROM events e
     JOIN calendar_sources s ON s.id = e.source_id
     WHERE s.user_id = $1
       AND ($2::timestamptz IS NULL OR e.end_at >= $2)
       AND ($3::timestamptz IS NULL OR e.start_at <= $3)
       AND ($4::text IS NULL OR e.category = $4)
     ORDER BY e.start_at ASC`,
    [req.auth!.sub, from ?? null, to ?? null, category ?? null]
  );

  return res.status(200).json(result.rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT e.id, e.source_id, e.title, e.description, e.location, e.start_at, e.end_at,
            e.all_day, e.category, e.created_at, e.updated_at
     FROM events e
     JOIN calendar_sources s ON s.id = e.source_id
     WHERE e.id = $1 AND s.user_id = $2`,
    [req.params.id, req.auth!.sub]
  );

  const event = result.rows[0];
  if (!event) {
    return res.status(404).json({ error: 'Événement introuvable' });
  }

  return res.status(200).json(event);
});

export { router as eventsRouter };
