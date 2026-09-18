import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body ?? {};

  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'name est requis' });
  }

  const result = await pool.query('INSERT INTO workspaces (name) VALUES ($1) RETURNING id, name, created_at', [
    name,
  ]);

  return res.status(201).json(result.rows[0]);
});

router.get('/:id', requireAuth, async (req, res) => {
  if (req.params.id !== req.auth!.workspace_id) {
    return res.status(403).json({ error: 'Accès refusé à ce workspace' });
  }

  const result = await pool.query('SELECT id, name, created_at FROM workspaces WHERE id = $1', [req.params.id]);

  const workspace = result.rows[0];
  if (!workspace) {
    return res.status(404).json({ error: 'Workspace introuvable' });
  }

  return res.status(200).json(workspace);
});

router.patch('/:id', requireAuth, async (req, res) => {
  if (req.params.id !== req.auth!.workspace_id) {
    return res.status(403).json({ error: 'Accès refusé à ce workspace' });
  }

  const { name } = req.body ?? {};
  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ error: 'name doit être une chaîne non vide' });
  }

  const result = await pool.query(
    'UPDATE workspaces SET name = COALESCE($2, name) WHERE id = $1 RETURNING id, name, created_at',
    [req.params.id, name ?? null]
  );

  const workspace = result.rows[0];
  if (!workspace) {
    return res.status(404).json({ error: 'Workspace introuvable' });
  }

  return res.status(200).json(workspace);
});

export { router as workspacesRouter };
