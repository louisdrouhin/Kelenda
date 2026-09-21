import type { PoolClient } from 'pg';
import { pool } from './db';

export interface InternalEventInput {
  userId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  category: 'ecole' | 'entreprise' | 'personnel';
}

export interface EventRow {
  id: string;
  source_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  category: string;
  is_deadline: boolean;
  created_at: string;
  updated_at: string;
}

// Point d'entrée unique pour "cet événement n'existe dans aucun calendrier
// externe" : événements créés manuellement (routes/events.ts), suggestions de
// révision acceptées (routes/free-slots.ts), et événements créés par un autre
// service pour le compte d'un utilisateur (routes/internal.ts, ex: suivi
// tuteur de tracking-service). Les trois partageaient la même logique
// dupliquée (créer/récupérer la source 'interne', insérer l'événement).
export async function createInternalEvent(input: InternalEventInput): Promise<EventRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sourceId = await getOrCreateInternalSourceId(client, input.userId);

    const eventResult = await client.query(
      `INSERT INTO events (source_id, title, description, location, start_at, end_at, all_day, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, source_id, title, description, location, start_at, end_at, all_day, category, is_deadline, created_at, updated_at`,
      [
        sourceId,
        input.title,
        input.description ?? null,
        input.location ?? null,
        input.startAt,
        input.endAt,
        input.allDay ?? false,
        input.category,
      ]
    );

    await client.query('COMMIT');
    return eventResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getOrCreateInternalSourceId(client: PoolClient, userId: string): Promise<string> {
  const sourceResult = await client.query(
    `INSERT INTO calendar_sources (user_id, type, label)
     VALUES ($1, 'interne', 'Événements Kelenda')
     ON CONFLICT (user_id) WHERE type = 'interne' DO NOTHING
     RETURNING id`,
    [userId]
  );

  if (sourceResult.rows[0]?.id) return sourceResult.rows[0].id;

  const existing = await client.query("SELECT id FROM calendar_sources WHERE user_id = $1 AND type = 'interne'", [
    userId,
  ]);
  return existing.rows[0].id;
}
