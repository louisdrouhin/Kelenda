import { Router } from 'express';
import { pool } from '../db';
import { requireInternalCaller } from '../middleware/require-internal-caller';

const router = Router();

router.get('/users/:id', requireInternalCaller, async (req, res) => {
  const result = await pool.query(
    'SELECT id, workspace_id, email, display_name, status FROM users WHERE id = $1',
    [req.params.id]
  );

  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  return res.status(200).json(user);
});

export { router as internalRouter };
