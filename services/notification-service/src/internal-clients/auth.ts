import { signInternalRequest } from '@kelenda/shared';

interface AuthServiceUser {
  id: string;
  workspace_id: string;
  email: string;
  display_name: string | null;
  status: string;
}

// Paire interne notification-service → auth-service (doc section 10,
// "Cas particulier de /auth/verify" / "Paires concrètes identifiées") —
// usage : récupérer l'adresse email de l'utilisateur pour le canal `email`
// (push_subscriptions ne contient pas cette donnée).
export async function fetchAuthUser(userId: string): Promise<AuthServiceUser> {
  const baseUrl = process.env.AUTH_SERVICE_INTERNAL_URL ?? 'http://localhost:3001';
  const secret = process.env.INTERNAL_SECRET_NOTIFICATION_AUTH;
  if (!secret) {
    throw new Error('INTERNAL_SECRET_NOTIFICATION_AUTH manquant');
  }

  const path = `/internal/users/${userId}`;
  const headers = signInternalRequest('notification-service', secret, 'GET', path);

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
