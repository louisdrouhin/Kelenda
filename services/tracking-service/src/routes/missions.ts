import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

const VALID_STATUSES = ['in_progress', 'done', 'cancelled'];

router.post('/', requireAuth, async (req, res) => {
  const { title, description, start_date, end_date, related_event_id } = req.body ?? {};

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title est requis' });
  }
  if (typeof start_date !== 'string' || Number.isNaN(Date.parse(start_date))) {
    return res.status(400).json({ error: 'start_date doit être une date valide' });
  }
  if (end_date !== undefined && end_date !== null && Number.isNaN(Date.parse(end_date))) {
    return res.status(400).json({ error: 'end_date doit être une date valide' });
  }

  const result = await pool.query(
    `INSERT INTO missions (user_id, title, description, start_date, end_date, related_event_id, source)
     VALUES ($1, $2, $3, $4, $5, $6, 'manual')
     RETURNING id, user_id, title, description, start_date, end_date, status, related_event_id, source, created_at, updated_at`,
    [req.auth!.sub, title, description ?? null, start_date, end_date ?? null, related_event_id ?? null]
  );

  return res.status(201).json(result.rows[0]);
});

router.get('/', requireAuth, async (req, res) => {
  const { status } = req.query;

  if (status !== undefined && (typeof status !== 'string' || !VALID_STATUSES.includes(status))) {
    return res.status(400).json({ error: `status doit être l'un de : ${VALID_STATUSES.join(', ')}` });
  }

  const result = await pool.query(
    `SELECT id, user_id, title, description, start_date, end_date, status, related_event_id, source, created_at, updated_at
     FROM missions
     WHERE user_id = $1
       AND ($2::text IS NULL OR status = $2)
     ORDER BY start_date DESC`,
    [req.auth!.sub, status ?? null]
  );

  return res.status(200).json(result.rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, user_id, title, description, start_date, end_date, status, related_event_id, source, created_at, updated_at
     FROM missions
     WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.auth!.sub]
  );

  const mission = result.rows[0];
  if (!mission) {
    return res.status(404).json({ error: 'Mission introuvable' });
  }

  return res.status(200).json(mission);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { title, description, start_date, end_date, status, related_event_id } = req.body ?? {};

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'title doit être une chaîne non vide' });
  }
  if (start_date !== undefined && (typeof start_date !== 'string' || Number.isNaN(Date.parse(start_date)))) {
    return res.status(400).json({ error: 'start_date doit être une date valide' });
  }
  if (end_date !== undefined && end_date !== null && Number.isNaN(Date.parse(end_date))) {
    return res.status(400).json({ error: 'end_date doit être une date valide' });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status doit être l'un de : ${VALID_STATUSES.join(', ')}` });
  }

  const result = await pool.query(
    `UPDATE missions
     SET title = COALESCE($3, title),
         description = COALESCE($4, description),
         start_date = COALESCE($5, start_date),
         end_date = CASE WHEN $6::boolean THEN $7::date ELSE end_date END,
         status = COALESCE($8, status),
         related_event_id = COALESCE($9, related_event_id)
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, title, description, start_date, end_date, status, related_event_id, source, created_at, updated_at`,
    [
      req.params.id,
      req.auth!.sub,
      title ?? null,
      description ?? null,
      start_date ?? null,
      end_date !== undefined,
      end_date ?? null,
      status ?? null,
      related_event_id ?? null,
    ]
  );

  const mission = result.rows[0];
  if (!mission) {
    return res.status(404).json({ error: 'Mission introuvable' });
  }

  return res.status(200).json(mission);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const result = await pool.query('DELETE FROM missions WHERE id = $1 AND user_id = $2 RETURNING id', [
    req.params.id,
    req.auth!.sub,
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Mission introuvable' });
  }

  return res.status(204).send();
});

export { router as missionsRouter };
