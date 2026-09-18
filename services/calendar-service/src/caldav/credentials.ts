import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { pool } from '../db';

const BCRYPT_ROUNDS = 12;
const GENERATED_PASSWORD_BYTES = 24;

export function generateCaldavPassword(): string {
  return randomBytes(GENERATED_PASSWORD_BYTES).toString('base64url');
}

export async function issueCaldavCredentials(
  userId: string,
  username: string
): Promise<{ username: string; password: string }> {
  const password = generateCaldavPassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await pool.query(
    `INSERT INTO caldav_credentials (user_id, username, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET username = $2, password_hash = $3`,
    [userId, username, passwordHash]
  );

  return { username, password };
}

export async function verifyCaldavCredentials(
  username: string,
  password: string
): Promise<{ userId: string } | null> {
  const result = await pool.query(
    'SELECT user_id, password_hash FROM caldav_credentials WHERE username = $1',
    [username]
  );

  const row = result.rows[0];
  if (!row) return null;

  const matches = await bcrypt.compare(password, row.password_hash);
  if (!matches) return null;

  return { userId: row.user_id };
}
