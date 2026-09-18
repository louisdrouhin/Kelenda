import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

const CREATABLE_TYPES = ['ics_ecole', 'ics_entreprise', 'caldav_perso'];

router.post('/', requireAuth, async (req, res) => {
  const { type, label, url } = req.body ?? {};

  if (typeof type !== 'string' || !CREATABLE_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de : ${CREATABLE_TYPES.join(', ')}` });
  }
  if (typeof url !== 'string' || url.trim().length === 0) {
    return res.status(400).json({ error: 'url est requise' });
  }
  if (label !== undefined && typeof label !== 'string') {
    return res.status(400).json({ error: 'label doit être une chaîne' });
  }

  const result = await pool.query(
    `INSERT INTO calendar_sources (user_id, type, label, url)
     VALUES ($1, $2, $3, $4)
     RETURNING id, type, label, url, last_synced_at, sync_status, created_at`,
    [req.auth!.sub, type, label ?? null, url]
  );

  return res.status(201).json(result.rows[0]);
});

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, type, label, url, last_synced_at, sync_status, created_at
     FROM calendar_sources
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.auth!.sub]
  );

  return res.status(200).json(result.rows);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { label, url } = req.body ?? {};

  if (label !== undefined && typeof label !== 'string') {
    return res.status(400).json({ error: 'label doit être une chaîne' });
  }
  if (url !== undefined && (typeof url !== 'string' || url.trim().length === 0)) {
    return res.status(400).json({ error: 'url doit être une chaîne non vide' });
  }

  const result = await pool.query(
    `UPDATE calendar_sources
     SET label = COALESCE($3, label), url = COALESCE($4, url)
     WHERE id = $1 AND user_id = $2 AND type <> 'interne'
     RETURNING id, type, label, url, last_synced_at, sync_status, created_at`,
    [req.params.id, req.auth!.sub, label ?? null, url ?? null]
  );

  const source = result.rows[0];
  if (!source) {
    return res.status(404).json({ error: 'Source introuvable' });
  }

  return res.status(200).json(source);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const result = await pool.query(
    `DELETE FROM calendar_sources
     WHERE id = $1 AND user_id = $2 AND type <> 'interne'
     RETURNING id`,
    [req.params.id, req.auth!.sub]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Source introuvable' });
  }

  return res.status(204).send();
});

export { router as sourcesRouter };
