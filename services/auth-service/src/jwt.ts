import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';

const privateKey = fs.readFileSync(
  process.env.JWT_PRIVATE_KEY_PATH ?? './keys/jwt-private.pem',
  'utf8'
);
const publicKey = fs.readFileSync(
  process.env.JWT_PUBLIC_KEY_PATH ?? './keys/jwt-public.pem',
  'utf8'
);

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
