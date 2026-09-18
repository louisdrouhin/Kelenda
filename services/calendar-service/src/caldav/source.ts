import type { PoolClient } from 'pg';
import { pool } from '../db';

// La collection CalDAV "personal" exposée par le serveur correspond à la
// source calendar_sources.type='caldav_perso' de cet utilisateur — un seul
// calendrier CalDAV par utilisateur pour ce MVP (pas de multi-calendrier).
// Contrairement à ics_ecole/ics_entreprise (créées explicitement via
// POST /calendar/sources), celle-ci est créée à la demande, au premier accès
// CalDAV (get-or-create), comme la source 'interne' des suggestions.
export async function getOrCreateCaldavSource(userId: string, client?: PoolClient): Promise<string> {
  const db = client ?? pool;

  const existing = await db.query(
    "SELECT id FROM calendar_sources WHERE user_id = $1 AND type = 'caldav_perso'",
    [userId]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await db.query(
    `INSERT INTO calendar_sources (user_id, type, label, sync_status)
     VALUES ($1, 'caldav_perso', 'Calendrier personnel', 'ok')
     ON CONFLICT (user_id) WHERE type = 'caldav_perso' DO NOTHING
     RETURNING id`,
    [userId]
  );
  if (created.rows[0]) return created.rows[0].id;

  // Course perdue face à un appel concurrent : la ligne existe désormais.
  const retry = await db.query(
    "SELECT id FROM calendar_sources WHERE user_id = $1 AND type = 'caldav_perso'",
    [userId]
  );
  return retry.rows[0].id;
}
