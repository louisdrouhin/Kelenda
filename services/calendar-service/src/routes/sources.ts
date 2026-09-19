import { Router } from 'express';
import { detectConflictsForUser } from '../conflicts';
import { pool } from '../db';
import { categoryForSourceType, fetchAndParseIcs, type SourceTypeToCategory } from '../ics';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

// caldav_perso n'est PAS créable manuellement : le serveur CalDAV (voir
// src/caldav/source.ts) la crée automatiquement au premier accès. Kelenda
// héberge son propre calendrier CalDAV (RFC 4791) plutôt que de se connecter
// en lecture à un serveur externe — décision explicite, différente d'une
// lecture initiale possible de "calendrier CalDAV dédié" dans la doc A.1.
const CREATABLE_TYPES = ['ics_ecole', 'ics_entreprise'];
const ICS_SYNCABLE_TYPES = ['ics_ecole', 'ics_entreprise'];

router.post('/', requireAuth, async (req, res) => {
  const { type, label, url } = req.body ?? {};

  if (typeof type !== 'string' || !CREATABLE_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de : ${CREATABLE_TYPES.join(', ')}` });
  }
  if (typeof url !== 'string' || url.trim().length === 0) {
    return res.status(400).json({ error: 'url est requise' });
  }
  if (label !== undefined && typeof label !== 'string') {
    return res.status(400).json({ error: 'label doit être une chaîne' });
  }

  const result = await pool.query(
    `INSERT INTO calendar_sources (user_id, type, label, url)
     VALUES ($1, $2, $3, $4)
     RETURNING id, type, label, url, last_synced_at, sync_status, created_at`,
    [req.auth!.sub, type, label ?? null, url]
  );

  return res.status(201).json(result.rows[0]);
});

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, type, label, url, last_synced_at, sync_status, created_at
     FROM calendar_sources
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.auth!.sub]
  );

  return res.status(200).json(result.rows);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { label, url } = req.body ?? {};

  if (label !== undefined && typeof label !== 'string') {
    return res.status(400).json({ error: 'label doit être une chaîne' });
  }
  if (url !== undefined && (typeof url !== 'string' || url.trim().length === 0)) {
    return res.status(400).json({ error: 'url doit être une chaîne non vide' });
  }

  const result = await pool.query(
    `UPDATE calendar_sources
     SET label = COALESCE($3, label), url = COALESCE($4, url)
     WHERE id = $1 AND user_id = $2 AND type <> 'interne'
     RETURNING id, type, label, url, last_synced_at, sync_status, created_at`,
    [req.params.id, req.auth!.sub, label ?? null, url ?? null]
  );

  const source = result.rows[0];
  if (!source) {
    return res.status(404).json({ error: 'Source introuvable' });
  }

  return res.status(200).json(source);
});

router.post('/:id/sync', requireAuth, async (req, res) => {
  const sourceResult = await pool.query(
    'SELECT id, type, url FROM calendar_sources WHERE id = $1 AND user_id = $2',
    [req.params.id, req.auth!.sub]
  );

  const source = sourceResult.rows[0];
  if (!source) {
    return res.status(404).json({ error: 'Source introuvable' });
  }
  if (!ICS_SYNCABLE_TYPES.includes(source.type)) {
    return res.status(400).json({ error: `Synchronisation non supportée pour le type "${source.type}"` });
  }

  const category = categoryForSourceType(source.type as SourceTypeToCategory);

  let parsedEvents;
  try {
    parsedEvents = await fetchAndParseIcs(source.url);
  } catch {
    await pool.query("UPDATE calendar_sources SET sync_status = 'error' WHERE id = $1", [source.id]);
    return res.status(502).json({ error: 'Échec de récupération ou de parsing du flux ICS' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const event of parsedEvents) {
      await client.query(
        `INSERT INTO events (source_id, external_uid, title, description, location, start_at, end_at, all_day, category, raw_ics_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (source_id, external_uid) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           location = EXCLUDED.location,
           start_at = EXCLUDED.start_at,
           end_at = EXCLUDED.end_at,
           all_day = EXCLUDED.all_day,
           raw_ics_data = EXCLUDED.raw_ics_data`,
        [
          source.id,
          event.externalUid,
          event.title,
          event.description,
          event.location,
          event.startAt,
          event.endAt,
          event.allDay,
          category,
          JSON.stringify(event.raw),
        ]
      );
    }

    await client.query(
      "UPDATE calendar_sources SET sync_status = 'ok', last_synced_at = now() WHERE id = $1",
      [source.id]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    await pool.query("UPDATE calendar_sources SET sync_status = 'error' WHERE id = $1", [source.id]);
    throw err;
  } finally {
    client.release();
  }

  const newConflictIds = await detectConflictsForUser(req.auth!.sub);

  return res.status(200).json({
    synced_events: parsedEvents.length,
    new_conflicts: newConflictIds.length,
  });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const result = await pool.query(
    `DELETE FROM calendar_sources
     WHERE id = $1 AND user_id = $2 AND type <> 'interne'
     RETURNING id`,
    [req.params.id, req.auth!.sub]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Source introuvable' });
  }

  return res.status(204).send();
});

export { router as sourcesRouter };
