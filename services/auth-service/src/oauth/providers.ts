export type OAuthProvider = 'google' | 'microsoft' | 'github';

export interface OAuthProviderConfig {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
}

const PROVIDER_ENDPOINTS: Record<OAuthProvider, Pick<OAuthProviderConfig, 'authorizationUrl' | 'tokenUrl' | 'userInfoUrl' | 'scope'>> = {
  google: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
  },
  microsoft: {
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
    scope: 'openid email profile',
  },
  github: {
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'read:user user:email',
  },
};

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === 'google' || value === 'microsoft' || value === 'github';
}

export function getOAuthProviderConfig(provider: OAuthProvider): OAuthProviderConfig {
  const envPrefix = provider.toUpperCase();
  const clientId = process.env[`${envPrefix}_OAUTH_CLIENT_ID`];
  const clientSecret = process.env[`${envPrefix}_OAUTH_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    throw new Error(`OAuth non configuré pour le provider "${provider}"`);
  }

  return {
    ...PROVIDER_ENDPOINTS[provider],
    clientId,
    clientSecret,
  };
}

export function getOAuthRedirectUri(provider: OAuthProvider): string {
  const base = process.env.OAUTH_REDIRECT_BASE_URL ?? 'http://localhost:3001';
  return `${base}/auth/callback/${provider}`;
}
