import { pool } from '../db';
import { signAccessToken } from '../jwt';
import { generateRefreshToken, hashRefreshToken } from '../refresh-token';

const REFRESH_TOKEN_TTL_DAYS = 30;

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function issueSession(userId: string, workspaceId: string, deviceInfo: string | undefined) {
  const accessToken = signAccessToken(userId, workspaceId);

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);

  await pool.query(
    'INSERT INTO sessions (user_id, refresh_token_hash, device_info, expires_at) VALUES ($1, $2, $3, $4)',
    [userId, refreshTokenHash, deviceInfo ?? null, refreshTokenExpiry()]
  );

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}
