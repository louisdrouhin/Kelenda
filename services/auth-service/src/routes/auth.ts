import bcrypt from 'bcrypt';
import { Router } from 'express';
import { pool } from '../db';
import { verifyAccessToken } from '../jwt';
import { requireAuth } from '../middleware/require-auth';
import { hashRefreshToken } from '../refresh-token';
import { issueSession } from './session';

const router = Router();

const BCRYPT_ROUNDS = 12;

router.post('/register', async (req, res) => {
  const { email, password, workspace_name } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string' || typeof workspace_name !== 'string') {
    return res.status(400).json({ error: 'email, password et workspace_name sont requis' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const workspaceResult = await client.query(
      'INSERT INTO workspaces (name) VALUES ($1) RETURNING id',
      [workspace_name]
    );
    const workspaceId = workspaceResult.rows[0].id;

    const userResult = await client.query(
      'INSERT INTO users (workspace_id, email) VALUES ($1, $2) RETURNING id, email, workspace_id',
      [workspaceId, email]
    );
    const user = userResult.rows[0];

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await client.query('INSERT INTO credentials (user_id, password_hash) VALUES ($1, $2)', [
      user.id,
      passwordHash,
    ]);

    await client.query('COMMIT');

    return res.status(201).json({
      id: user.id,
      email: user.email,
      workspace_id: user.workspace_id,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
    }
    throw err;
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'email et password sont requis' });
  }

  const userResult = await pool.query(
    `SELECT u.id, u.workspace_id, u.status, c.password_hash
     FROM users u
     JOIN credentials c ON c.user_id = u.id
     WHERE u.email = $1`,
    [email]
  );

  const user = userResult.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Compte suspendu' });
  }

  return res.status(200).json(await issueSession(user.id, user.workspace_id, req.headers['user-agent']));
});

router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body ?? {};

  if (typeof refresh_token !== 'string') {
    return res.status(400).json({ error: 'refresh_token requis' });
  }

  const tokenHash = hashRefreshToken(refresh_token);

  const sessionResult = await pool.query(
    `SELECT s.id, s.user_id, u.workspace_id
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.refresh_token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > now()`,
    [tokenHash]
  );

  const session = sessionResult.rows[0];
  if (!session) {
    return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
  }

  // Rotation : la session existante est révoquée, une nouvelle est émise.
  await pool.query('UPDATE sessions SET revoked_at = now() WHERE id = $1', [session.id]);

  return res
    .status(200)
    .json(await issueSession(session.user_id, session.workspace_id, req.headers['user-agent']));
});

router.post('/logout', requireAuth, async (req, res) => {
  const { refresh_token } = req.body ?? {};

  if (typeof refresh_token !== 'string') {
    return res.status(400).json({ error: 'refresh_token requis' });
  }

  const tokenHash = hashRefreshToken(refresh_token);
  await pool.query(
    'UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND refresh_token_hash = $2 AND revoked_at IS NULL',
    [req.auth!.sub, tokenHash]
  );

  return res.status(204).send();
});

router.post('/logout-all', requireAuth, async (req, res) => {
  await pool.query('UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [
    req.auth!.sub,
  ]);

  return res.status(204).send();
});

router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, workspace_id, email, display_name, role, status, created_at FROM users WHERE id = $1',
    [req.auth!.sub]
  );

  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  return res.status(200).json(user);
});

router.patch('/me', requireAuth, async (req, res) => {
  const { display_name } = req.body ?? {};

  if (display_name !== undefined && typeof display_name !== 'string') {
    return res.status(400).json({ error: 'display_name doit être une chaîne' });
  }

  const result = await pool.query(
    'UPDATE users SET display_name = COALESCE($2, display_name) WHERE id = $1 RETURNING id, workspace_id, email, display_name, role, status, created_at, updated_at',
    [req.auth!.sub, display_name ?? null]
  );

  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  return res.status(200).json(user);
});

router.get('/sessions', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, device_info, created_at, expires_at
     FROM sessions
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC`,
    [req.auth!.sub]
  );

  return res.status(200).json(result.rows);
});

router.delete('/sessions/:id', requireAuth, async (req, res) => {
  const result = await pool.query(
    'UPDATE sessions SET revoked_at = now() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL RETURNING id',
    [req.params.id, req.auth!.sub]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Session introuvable' });
  }

  return res.status(204).send();
});

router.get('/verify', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).send();
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    res.setHeader('X-User-Id', payload.sub);
    res.setHeader('X-Workspace-Id', payload.workspace_id);
    return res.status(200).send();
  } catch {
    return res.status(401).send();
  }
});

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

export { router as authRouter };
