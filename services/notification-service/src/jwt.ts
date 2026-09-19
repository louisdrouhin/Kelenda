import fs from 'node:fs';
import jwt from 'jsonwebtoken';

function loadKey(envValue: string | undefined, envPath: string | undefined, defaultPath: string): string {
  if (envValue) return envValue;
  return fs.readFileSync(envPath ?? defaultPath, 'utf8');
}

// JWT_PUBLIC_KEY (valeur PEM directe, K8s Secret) a priorité sur
// JWT_PUBLIC_KEY_PATH (fichier, dev local) — même convention qu'auth-service.
const publicKey = loadKey(
  process.env.JWT_PUBLIC_KEY,
  process.env.JWT_PUBLIC_KEY_PATH,
  '../auth-service/keys/jwt-public.pem'
);

export type UserRole = 'admin' | 'member';

export interface AccessTokenPayload {
  sub: string; // user_id
  workspace_id: string;
  role: UserRole;
  jti: string;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
  }) as AccessTokenPayload;
}
