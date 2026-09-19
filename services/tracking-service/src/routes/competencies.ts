import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

// Pas de route de création de référentiel/nœud dans la doc (section 10) —
// un framework est alimenté directement en base pour l'instant (trou connu,
// voir Kelenda_Suivi_Implementation.md). On sert le plus récent par école
// (created_at DESC) s'il en existe plusieurs versions.
router.get('/frameworks/:school', requireAuth, async (req, res) => {
  const frameworkResult = await pool.query(
    `SELECT id, school_name, version, created_at
     FROM competency_frameworks
     WHERE school_name = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [req.params.school]
  );

  const framework = frameworkResult.rows[0];
  if (!framework) {
    return res.status(404).json({ error: 'Référentiel introuvable pour cette école' });
  }

  const nodesResult = await pool.query(
    `SELECT id, framework_id, parent_id, code, label
     FROM competency_nodes
     WHERE framework_id = $1
     ORDER BY code ASC`,
    [framework.id]
  );

  return res.status(200).json({ ...framework, nodes: nodesResult.rows });
});

router.get('/competencies', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT ce.id, ce.competency_node_id, ce.level_achieved, ce.last_updated_at,
            cn.code, cn.label, cn.framework_id
     FROM competency_entries ce
     JOIN competency_nodes cn ON cn.id = ce.competency_node_id
     WHERE ce.user_id = $1
     ORDER BY cn.code ASC`,
    [req.auth!.sub]
  );

  return res.status(200).json(result.rows);
});

router.patch('/competencies/:node_id', requireAuth, async (req, res) => {
  const { level_achieved } = req.body ?? {};

  if (typeof level_achieved !== 'string' || level_achieved.trim() === '') {
    return res.status(400).json({ error: 'level_achieved est requis' });
  }

  const nodeResult = await pool.query('SELECT id FROM competency_nodes WHERE id = $1', [req.params.node_id]);
  if (!nodeResult.rows[0]) {
    return res.status(404).json({ error: 'Compétence introuvable' });
  }

  const result = await pool.query(
    `INSERT INTO competency_entries (user_id, competency_node_id, level_achieved)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, competency_node_id)
     DO UPDATE SET level_achieved = EXCLUDED.level_achieved, last_updated_at = now()
     RETURNING id, competency_node_id, level_achieved, last_updated_at`,
    [req.auth!.sub, req.params.node_id, level_achieved]
  );

  return res.status(200).json(result.rows[0]);
});

router.post('/missions/:id/competencies', requireAuth, async (req, res) => {
  const { competency_node_ids } = req.body ?? {};

  if (!Array.isArray(competency_node_ids) || competency_node_ids.length === 0) {
    return res.status(400).json({ error: 'competency_node_ids doit être un tableau non vide' });
  }
  if (!competency_node_ids.every((id) => typeof id === 'string')) {
    return res.status(400).json({ error: 'competency_node_ids doit contenir uniquement des uuid' });
  }

  const missionResult = await pool.query('SELECT id FROM missions WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.auth!.sub,
  ]);
  if (!missionResult.rows[0]) {
    return res.status(404).json({ error: 'Mission introuvable' });
  }

  const nodesResult = await pool.query('SELECT id FROM competency_nodes WHERE id = ANY($1::uuid[])', [
    competency_node_ids,
  ]);
  if (nodesResult.rows.length !== competency_node_ids.length) {
    return res.status(400).json({ error: 'Un ou plusieurs competency_node_ids sont introuvables' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const nodeId of competency_node_ids) {
      await client.query(
        `INSERT INTO mission_competency_links (mission_id, competency_node_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [req.params.id, nodeId]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const linksResult = await pool.query(
    `SELECT cn.id, cn.code, cn.label
     FROM mission_competency_links mcl
     JOIN competency_nodes cn ON cn.id = mcl.competency_node_id
     WHERE mcl.mission_id = $1
     ORDER BY cn.code ASC`,
    [req.params.id]
  );

  return res.status(201).json(linksResult.rows);
});

export { router as competenciesRouter };
