import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

const VALID_TUTOR_TYPES = ['entreprise', 'pedagogique'];
const VALID_INTERACTION_TYPES = ['visite', 'bilan', 'echange'];

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, user_id, type, name, email, phone, availability_notes
     FROM tutors
     WHERE user_id = $1
     ORDER BY name ASC`,
    [req.auth!.sub]
  );

  return res.status(200).json(result.rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { type, name, email, phone, availability_notes } = req.body ?? {};

  if (!VALID_TUTOR_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de : ${VALID_TUTOR_TYPES.join(', ')}` });
  }
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name est requis' });
  }

  const result = await pool.query(
    `INSERT INTO tutors (user_id, type, name, email, phone, availability_notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, type, name, email, phone, availability_notes`,
    [req.auth!.sub, type, name, email ?? null, phone ?? null, availability_notes ?? null]
  );

  return res.status(201).json(result.rows[0]);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { type, name, email, phone, availability_notes } = req.body ?? {};

  if (type !== undefined && !VALID_TUTOR_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de : ${VALID_TUTOR_TYPES.join(', ')}` });
  }
  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return res.status(400).json({ error: 'name doit être une chaîne non vide' });
  }

  const result = await pool.query(
    `UPDATE tutors
     SET type = COALESCE($3, type),
         name = COALESCE($4, name),
         email = COALESCE($5, email),
         phone = COALESCE($6, phone),
         availability_notes = COALESCE($7, availability_notes)
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, type, name, email, phone, availability_notes`,
    [req.params.id, req.auth!.sub, type ?? null, name ?? null, email ?? null, phone ?? null, availability_notes ?? null]
  );

  const tutor = result.rows[0];
  if (!tutor) {
    return res.status(404).json({ error: 'Tuteur introuvable' });
  }

  return res.status(200).json(tutor);
});

router.post('/:id/interactions', requireAuth, async (req, res) => {
  const { interaction_date, type, notes } = req.body ?? {};

  if (typeof interaction_date !== 'string' || Number.isNaN(Date.parse(interaction_date))) {
    return res.status(400).json({ error: 'interaction_date doit être une date valide' });
  }
  if (!VALID_INTERACTION_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de : ${VALID_INTERACTION_TYPES.join(', ')}` });
  }

  const tutorResult = await pool.query('SELECT id FROM tutors WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.auth!.sub,
  ]);
  if (!tutorResult.rows[0]) {
    return res.status(404).json({ error: 'Tuteur introuvable' });
  }

  const result = await pool.query(
    `INSERT INTO tutor_interactions (tutor_id, interaction_date, type, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING id, tutor_id, interaction_date, type, notes, created_at`,
    [req.params.id, interaction_date, type, notes ?? null]
  );

  return res.status(201).json(result.rows[0]);
});

router.get('/:id/interactions', requireAuth, async (req, res) => {
  const tutorResult = await pool.query('SELECT id FROM tutors WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.auth!.sub,
  ]);
  if (!tutorResult.rows[0]) {
    return res.status(404).json({ error: 'Tuteur introuvable' });
  }

  const result = await pool.query(
    `SELECT id, tutor_id, interaction_date, type, notes, created_at
     FROM tutor_interactions
     WHERE tutor_id = $1
     ORDER BY interaction_date DESC`,
    [req.params.id]
  );

  return res.status(200).json(result.rows);
});

export { router as tutorsRouter };
