import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

router.post('/generate', requireAuth, async (req, res) => {
  const { period_start, period_end, format } = req.body ?? {};

  if (typeof period_start !== 'string' || Number.isNaN(Date.parse(period_start))) {
    return res.status(400).json({ error: 'period_start doit être une date valide' });
  }
  if (typeof period_end !== 'string' || Number.isNaN(Date.parse(period_end))) {
    return res.status(400).json({ error: 'period_end doit être une date valide' });
  }
  if (format !== undefined && format !== 'pdf' && format !== 'json') {
    return res.status(400).json({ error: "format doit être 'pdf' ou 'json'" });
  }

  // Snapshot des missions de la période au moment de la génération — le
  // rapport reste stable même si les missions sont modifiées ensuite
  // (conforme au but de content_snapshot, doc section 9.4).
  const missionsResult = await pool.query(
    `SELECT id, title, description, start_date, end_date, status, source
     FROM missions
     WHERE user_id = $1 AND start_date >= $2 AND start_date <= $3
     ORDER BY start_date ASC`,
    [req.auth!.sub, period_start, period_end]
  );

  const result = await pool.query(
    `INSERT INTO activity_reports (user_id, period_start, period_end, format, content_snapshot)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, period_start, period_end, generated_at, format, content_snapshot`,
    [req.auth!.sub, period_start, period_end, format ?? 'pdf', JSON.stringify({ missions: missionsResult.rows })]
  );

  return res.status(201).json(result.rows[0]);
});

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, user_id, period_start, period_end, generated_at, format
     FROM activity_reports
     WHERE user_id = $1
     ORDER BY generated_at DESC`,
    [req.auth!.sub]
  );

  return res.status(200).json(result.rows);
});

router.get('/:id/download', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, user_id, period_start, period_end, generated_at, format, content_snapshot
     FROM activity_reports
     WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.auth!.sub]
  );

  const report = result.rows[0];
  if (!report) {
    return res.status(404).json({ error: 'Rapport introuvable' });
  }

  // Pas de génération PDF réelle pour l'instant (hors périmètre de cette
  // passe) — on sert le snapshot JSON quel que soit le `format` demandé à
  // la génération ; un vrai rendu PDF est un chantier séparé.
  return res.status(200).json(report);
});

export { router as reportsRouter };
