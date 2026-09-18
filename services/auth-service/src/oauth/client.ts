import type { OAuthProvider, OAuthProviderConfig } from './providers';

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface OAuthProfile {
  providerUserId: string;
  email: string;
}

export async function exchangeCodeForTokens(
  config: OAuthProviderConfig,
  code: string,
  redirectUri: string
): Promise<OAuthTokens> {
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Échange du code OAuth échoué (${response.status})`);
  }

  return (await response.json()) as OAuthTokens;
}

export async function fetchOAuthProfile(
  provider: OAuthProvider,
  config: OAuthProviderConfig,
  accessToken: string
): Promise<OAuthProfile> {
  const response = await fetch(config.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Récupération du profil OAuth échouée (${response.status})`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (provider === 'github') {
    return fetchGithubProfile(data, accessToken);
  }

  // google / microsoft (OIDC userinfo)
  return {
    providerUserId: String(data.sub),
    email: String(data.email),
  };
}

async function fetchGithubProfile(data: Record<string, unknown>, accessToken: string): Promise<OAuthProfile> {
  const providerUserId = String(data.id);

  if (typeof data.email === 'string' && data.email.length > 0) {
    return { providerUserId, email: data.email };
  }

  const emailsResponse = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!emailsResponse.ok) {
    throw new Error(`Récupération des emails GitHub échouée (${emailsResponse.status})`);
  }

  const emails = (await emailsResponse.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
  const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);

  if (!primary) {
    throw new Error('Aucun email GitHub vérifié trouvé');
  }

  return { providerUserId, email: primary.email };
}
