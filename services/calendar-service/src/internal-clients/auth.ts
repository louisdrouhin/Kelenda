import { signInternalRequest } from '@kelenda/shared';

interface AuthServiceUser {
  id: string;
  workspace_id: string;
  email: string;
  display_name: string | null;
  status: string;
}

// Paire interne calendar-service → auth-service, sur le même modèle que
// tracking-service/notification-service → auth-service (doc section 5,
// "Authentification service-à-service") : secret dédié à cette paire,
// requête signée HMAC, anti-rejeu 30s.
export async function fetchAuthUser(userId: string): Promise<AuthServiceUser> {
  const baseUrl = process.env.AUTH_SERVICE_INTERNAL_URL ?? 'http://localhost:3001';
  const secret = process.env.INTERNAL_SECRET_CALENDAR_AUTH;
  if (!secret) {
    throw new Error('INTERNAL_SECRET_CALENDAR_AUTH manquant');
  }

  const path = `/internal/users/${userId}`;
  const headers = signInternalRequest('calendar-service', secret, 'GET', path);

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'X-Calling-Service': headers['X-Calling-Service'],
      'X-Timestamp': headers['X-Timestamp'],
      'X-Signature': headers['X-Signature'],
    },
  });

  if (!response.ok) {
    throw new Error(`Échec de récupération de l'utilisateur ${userId} auprès d'auth-service (${response.status})`);
  }

  return (await response.json()) as AuthServiceUser;
}
