import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';

function loadKey(envValue: string | undefined, envPath: string | undefined, defaultPath: string): string {
  if (envValue) return envValue;
  return fs.readFileSync(envPath ?? defaultPath, 'utf8');
}

// JWT_PRIVATE_KEY/JWT_PUBLIC_KEY (valeur PEM directe, utilisé en K8s via Secret — doc section 12.4)
// a priorité sur JWT_PRIVATE_KEY_PATH/JWT_PUBLIC_KEY_PATH (fichier, utilisé en dev local).
const privateKey = loadKey(process.env.JWT_PRIVATE_KEY, process.env.JWT_PRIVATE_KEY_PATH, './keys/jwt-private.pem');
const publicKey = loadKey(process.env.JWT_PUBLIC_KEY, process.env.JWT_PUBLIC_KEY_PATH, './keys/jwt-public.pem');

const ACCESS_TOKEN_TTL = '15m';

export type UserRole = 'admin' | 'member';

export interface AccessTokenPayload {
  sub: string; // user_id
  workspace_id: string;
  role: UserRole;
  jti: string;
}

export function signAccessToken(userId: string, workspaceId: string, role: UserRole): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    workspace_id: workspaceId,
    role,
    jti: randomUUID(),
  };

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
  }) as AccessTokenPayload;
}
