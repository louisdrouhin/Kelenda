import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { Router } from 'express';
import { pool } from '../db';
import { requireAuth } from '../middleware/require-auth';
import { exchangeCodeForTokens, fetchOAuthProfile } from '../oauth/client';
import { oauthExchangeCodeStore, oauthStateStore } from '../oauth/ephemeral-store';
import { getOAuthProviderConfig, getOAuthRedirectUri, isOAuthProvider } from '../oauth/providers';
import { encryptToken } from '../oauth/token-crypto';
import { issueSession } from './session';

const router = Router();

function getFrontendUrl(): string {
  return process.env.FRONTEND_URL ?? 'http://localhost:5183';
}

router.get('/login/:provider', (req, res) => {
  const { provider } = req.params;
  if (!isOAuthProvider(provider)) {
    return res.status(400).json({ error: 'Provider OAuth inconnu' });
  }

  const config = getOAuthProviderConfig(provider);
  const redirectUri = getOAuthRedirectUri(provider);
  const state = randomUUID();
  oauthStateStore.set(state, { provider });

  const authorizationUrl = new URL(config.authorizationUrl);
  authorizationUrl.searchParams.set('client_id', config.clientId);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', config.scope);
  authorizationUrl.searchParams.set('state', state);

  return res.redirect(authorizationUrl.toString());
});

router.get('/callback/:provider', async (req, res) => {
  const { provider } = req.params;
  const { code, state } = req.query;

  if (!isOAuthProvider(provider)) {
    return res.status(400).json({ error: 'Provider OAuth inconnu' });
  }
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'code manquant' });
  }
  if (typeof state !== 'string') {
    return res.status(400).json({ error: 'state manquant' });
  }

  // Anti-CSRF : le state doit être celui émis par /login/:provider pour ce
  // même provider, et n'est utilisable qu'une fois (take() le consomme).
  const storedState = oauthStateStore.take(state);
  if (!storedState || storedState.provider !== provider) {
    return res.status(401).json({ error: 'state invalide ou expiré' });
  }

  const config = getOAuthProviderConfig(provider);
  const redirectUri = getOAuthRedirectUri(provider);

  const tokens = await exchangeCodeForTokens(config, code, redirectUri);
  const profile = await fetchOAuthProfile(provider, config, tokens.access_token);

  const identityResult = await pool.query(
    `SELECT i.user_id, u.workspace_id
     FROM identities i
     JOIN users u ON u.id = i.user_id
     WHERE i.provider = $1 AND i.provider_user_id = $2`,
    [provider, profile.providerUserId]
  );

  const identity = identityResult.rows[0];
  if (identity) {
    await refreshIdentityTokens(provider, profile.providerUserId, tokens);
    const session = await issueSession(identity.user_id, identity.workspace_id, req.headers['user-agent']);
    return redirectWithExchangeCode(res, session);
  }

  // Pas d'identity existante pour ce provider : première connexion via ce provider.
  const existingUserResult = await pool.query('SELECT id FROM users WHERE email = $1', [profile.email]);
  if (existingUserResult.rows[0]) {
    // L'email est déjà pris par un compte (password ou autre provider) non lié à celui-ci :
    // on refuse la liaison automatique pour éviter une prise de compte silencieuse.
    const message = encodeURIComponent(
      'Un compte existe déjà avec cet email. Connecte-toi puis lie ce provider depuis les paramètres.'
    );
    return res.redirect(`${getFrontendUrl()}/login?oauth_error=${message}`);
  }

  const created = await createUserFromOAuthProfile(provider, profile, tokens);
  const session = await issueSession(created.userId, created.workspaceId, req.headers['user-agent']);
  return redirectWithExchangeCode(res, session);
});

function redirectWithExchangeCode(res: Response, session: { access_token: string; refresh_token: string }) {
  const exchangeCode = randomUUID();
  oauthExchangeCodeStore.set(exchangeCode, session);
  return res.redirect(`${getFrontendUrl()}/oauth/callback?code=${exchangeCode}`);
}

// Échange le code temporaire (issu de la redirection /callback/:provider)
// contre les vrais tokens — appelé par le frontend juste après la
// redirection. Usage unique : un second appel avec le même code échoue.
router.post('/exchange', (req, res) => {
  const { code } = req.body ?? {};
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'code est requis' });
  }

  const session = oauthExchangeCodeStore.take(code);
  if (!session) {
    return res.status(401).json({ error: 'code invalide, expiré, ou déjà utilisé' });
  }

  return res.status(200).json(session);
});

router.post('/link/:provider', requireAuth, async (req, res) => {
  const { provider } = req.params;
  const { code } = req.body ?? {};

  if (!isOAuthProvider(provider)) {
    return res.status(400).json({ error: 'Provider OAuth inconnu' });
  }
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'code manquant' });
  }

  const config = getOAuthProviderConfig(provider);
  const redirectUri = getOAuthRedirectUri(provider);

  const tokens = await exchangeCodeForTokens(config, code, redirectUri);
  const profile = await fetchOAuthProfile(provider, config, tokens.access_token);

  try {
    await pool.query(
      `INSERT INTO identities
         (user_id, provider, provider_user_id, access_token_encrypted, refresh_token_encrypted, token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.auth!.sub,
        provider,
        profile.providerUserId,
        encryptToken(tokens.access_token),
        tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
        tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      ]
    );
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: 'Ce compte provider est déjà lié (à vous ou à un autre utilisateur)' });
    }
    throw err;
  }

  return res.status(201).json({ provider, linked: true });
});

router.delete('/link/:provider', requireAuth, async (req, res) => {
  const { provider } = req.params;
  if (!isOAuthProvider(provider)) {
    return res.status(400).json({ error: 'Provider OAuth inconnu' });
  }

  const result = await pool.query('DELETE FROM identities WHERE user_id = $1 AND provider = $2 RETURNING id', [
    req.auth!.sub,
    provider,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Ce provider n\'est pas lié à votre compte' });
  }

  return res.status(204).send();
});

async function createUserFromOAuthProfile(
  provider: string,
  profile: { providerUserId: string; email: string },
  tokens: { access_token: string; refresh_token?: string; expires_in?: number }
): Promise<{ userId: string; workspaceId: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const workspaceResult = await client.query(
      'INSERT INTO workspaces (name) VALUES ($1) RETURNING id',
      [`Workspace de ${profile.email}`]
    );
    const workspaceId = workspaceResult.rows[0].id;

    const userResult = await client.query(
      'INSERT INTO users (workspace_id, email) VALUES ($1, $2) RETURNING id',
      [workspaceId, profile.email]
    );
    const userId = userResult.rows[0].id;

    await client.query(
      `INSERT INTO identities
         (user_id, provider, provider_user_id, access_token_encrypted, refresh_token_encrypted, token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        provider,
        profile.providerUserId,
        encryptToken(tokens.access_token),
        tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
        tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      ]
    );

    await client.query('COMMIT');
    return { userId, workspaceId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function refreshIdentityTokens(
  provider: string,
  providerUserId: string,
  tokens: { access_token: string; refresh_token?: string; expires_in?: number }
) {
  await pool.query(
    `UPDATE identities
     SET access_token_encrypted = $3,
         refresh_token_encrypted = COALESCE($4, refresh_token_encrypted),
         token_expires_at = $5
     WHERE provider = $1 AND provider_user_id = $2`,
    [
      provider,
      providerUserId,
      encryptToken(tokens.access_token),
      tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
      tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
    ]
  );
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

export { router as oauthRouter };
