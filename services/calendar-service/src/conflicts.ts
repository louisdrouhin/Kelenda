import { pool } from './db';

// Détecte les chevauchements entre événements 'ecole' et 'entreprise' (A.3) pour un
// utilisateur donné, et persiste les nouveaux conflits (idempotent grâce à la
// contrainte UNIQUE (event_a_id, event_b_id) — ON CONFLICT DO NOTHING).
// Ne compare pas les événements 'personnel' : un chevauchement avec du perso
// n'est pas un conflit école/entreprise au sens de A.3.
export async function detectConflictsForUser(userId: string): Promise<string[]> {
  const result = await pool.query(
    `INSERT INTO detected_conflicts (event_a_id, event_b_id)
     SELECT LEAST(a.id, b.id), GREATEST(a.id, b.id)
     FROM events a
     JOIN calendar_sources sa ON sa.id = a.source_id
     JOIN events b ON b.id <> a.id AND a.during && b.during
     JOIN calendar_sources sb ON sb.id = b.source_id
     WHERE sa.user_id = $1
       AND sb.user_id = $1
       AND a.category = 'ecole'
       AND b.category = 'entreprise'
     ON CONFLICT (event_a_id, event_b_id) DO NOTHING
     RETURNING id`,
    [userId]
  );

  return result.rows.map((row) => row.id);
}
