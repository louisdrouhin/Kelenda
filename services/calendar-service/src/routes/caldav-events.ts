import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { requireBasicAuth } from '../caldav/require-basic-auth';
import { parseVeventDocument } from '../caldav/ical-reader';
import { eventToIcsDocument } from '../caldav/ical-writer';
import { parseCalendarQueryTimeRange } from '../caldav/query-parser';
import { getOrCreateCaldavSource } from '../caldav/source';
import { decodeSyncToken, encodeSyncToken, parseSyncToken } from '../caldav/sync-query-parser';
import { buildMultistatus, buildResponse, xmlEscape } from '../caldav/xml';
import { pool } from '../db';

const router = Router();

const CALDAV_NS = 'urn:ietf:params:xml:ns:caldav';

function eventHref(userId: string, event: { caldav_href: string }): string {
  return `/calendar/caldav/calendars/${userId}/personal/${event.caldav_href}`;
}

// RFC 4791 calendar-query et RFC 6578 sync-collection partagent la même
// route WebDAV (REPORT sur la collection) — seule la racine du body XML
// change (<C:calendar-query> vs <D:sync-collection>). On distingue les deux
// en cherchant "sync-collection" dans le body brut plutôt que de parser deux
// fois : les clients réels envoient l'un ou l'autre, jamais les deux à la fois.
router.report('/calendars/:userId/personal/', requireBasicAuth, async (req, res) => {
  if (req.params.userId !== req.caldavUserId) {
    return res.status(403).send();
  }

  const body = typeof req.body === 'string' ? req.body : '';

  if (body.includes('sync-collection')) {
    return handleSyncCollection(req, res, body);
  }

  const timeRange = await parseCalendarQueryTimeRange(body);
  const sourceId = await getOrCreateCaldavSource(req.caldavUserId!);

  const result = await pool.query(
    `SELECT id, title, description, location, start_at, end_at, all_day, caldav_href, caldav_etag
     FROM events
     WHERE source_id = $1
       AND ($2::timestamptz IS NULL OR end_at >= $2)
       AND ($3::timestamptz IS NULL OR start_at <= $3)
     ORDER BY start_at ASC`,
    [sourceId, timeRange.start ?? null, timeRange.end ?? null]
  );

  const responses = result.rows.map((event) => {
    const href = eventHref(req.caldavUserId!, event);
    return buildResponse(
      href,
      `        <D:getetag>"${xmlEscape(event.caldav_etag)}"</D:getetag>
        <C:calendar-data xmlns:C="${CALDAV_NS}">${xmlEscape(eventToIcsDocument(event))}</C:calendar-data>`
    );
  });

  res.status(207).type('application/xml; charset=utf-8').send(buildMultistatus(responses));
});

async function handleSyncCollection(req: Request, res: Response, body: string) {
  const userId = req.caldavUserId!;
  const clientToken = await parseSyncToken(body);
  const sinceId = decodeSyncToken(clientToken);

  const sourceId = await getOrCreateCaldavSource(userId);

  // Watermark actuel AVANT de lire les changements, pour que le prochain
  // sync-token renvoyé ne "rate" jamais un changement écrit entre les deux
  // requêtes SQL ci-dessous (un id plus élevé créé après ce SELECT sera
  // simplement inclus à la prochaine sync, jamais perdu).
  const watermarkResult = await pool.query(
    'SELECT COALESCE(MAX(id), 0) AS max_id FROM caldav_sync_changes WHERE source_id = $1',
    [sourceId]
  );
  const watermark: number = Number(watermarkResult.rows[0].max_id);

  const changesResult = await pool.query(
    `SELECT DISTINCT ON (caldav_href) caldav_href, change_type
     FROM caldav_sync_changes
     WHERE source_id = $1 AND id > $2
     ORDER BY caldav_href, id DESC`,
    [sourceId, sinceId]
  );

  const responses: string[] = [];

  for (const change of changesResult.rows) {
    const href = `/calendar/caldav/calendars/${userId}/personal/${change.caldav_href}`;

    if (change.change_type === 'deleted') {
      responses.push(buildResponse(href, '', 'HTTP/1.1 404 Not Found'));
      continue;
    }

    const eventResult = await pool.query(
      `SELECT id, title, description, location, start_at, end_at, all_day, caldav_href, caldav_etag
       FROM events WHERE source_id = $1 AND caldav_href = $2`,
      [sourceId, change.caldav_href]
    );
    const event = eventResult.rows[0];
    if (!event) continue; // recréé puis supprimé entre-temps : rien à annoncer

    responses.push(
      buildResponse(
        href,
        `        <D:getetag>"${xmlEscape(event.caldav_etag)}"</D:getetag>
        <C:calendar-data xmlns:C="${CALDAV_NS}">${xmlEscape(eventToIcsDocument(event))}</C:calendar-data>`
      )
    );
  }

  const newToken = encodeSyncToken(watermark);
  const body207 = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:" xmlns:C="${CALDAV_NS}">
${responses.join('\n')}
  <D:sync-token>${xmlEscape(newToken)}</D:sync-token>
</D:multistatus>`;

  res.status(207).type('application/xml; charset=utf-8').send(body207);
}

router.get('/calendars/:userId/personal/:eventFile', requireBasicAuth, async (req, res) => {
  if (req.params.userId !== req.caldavUserId) {
    return res.status(403).send();
  }

  const sourceId = await getOrCreateCaldavSource(req.caldavUserId!);

  const result = await pool.query(
    `SELECT id, title, description, location, start_at, end_at, all_day, caldav_etag
     FROM events
     WHERE source_id = $1 AND caldav_href = $2`,
    [sourceId, req.params.eventFile]
  );

  const event = result.rows[0];
  if (!event) {
    return res.status(404).send();
  }

  res.setHeader('ETag', `"${event.caldav_etag}"`);
  res.type('text/calendar; charset=utf-8').send(eventToIcsDocument(event));
});

router.put('/calendars/:userId/personal/:eventFile', requireBasicAuth, async (req, res) => {
  if (req.params.userId !== req.caldavUserId) {
    return res.status(403).send();
  }
  if (typeof req.body !== 'string') {
    return res.status(400).send();
  }

  let parsed;
  try {
    parsed = parseVeventDocument(req.body);
  } catch (err) {
    return res.status(400).send(`Document iCalendar invalide : ${(err as Error).message}`);
  }

  const ifMatch = req.header('If-Match');
  const ifNoneMatch = req.header('If-None-Match');
  const sourceId = await getOrCreateCaldavSource(req.caldavUserId!);

  const existingResult = await pool.query(
    'SELECT id, caldav_etag FROM events WHERE source_id = $1 AND caldav_href = $2',
    [sourceId, req.params.eventFile]
  );
  const existing = existingResult.rows[0];

  // RFC 4791 §5.3.2 : If-None-Match: * exige une création — échoue si la
  // ressource existe déjà (évite d'écraser silencieusement un événement
  // qu'un autre client vient de créer, cas rare mais couvert par le protocole).
  if (ifNoneMatch === '*' && existing) {
    return res.status(412).send();
  }
  // RFC 4791 §5.3.4 : If-Match protège une modification contre un conflit
  // d'édition concurrente — le client envoie l'ETag qu'il connaît, on
  // refuse si l'événement a changé depuis (quelqu'un/quelque chose d'autre
  // a déjà modifié entretemps).
  if (ifMatch && (!existing || `"${existing.caldav_etag}"` !== ifMatch)) {
    return res.status(412).send();
  }

  const newEtag = randomUUID();
  const changeType = existing ? 'updated' : 'created';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (existing) {
      await client.query(
        `UPDATE events
         SET title = $2, description = $3, location = $4, start_at = $5, end_at = $6,
             all_day = $7, caldav_etag = $8
         WHERE id = $1`,
        [
          existing.id,
          parsed.title,
          parsed.description,
          parsed.location,
          parsed.startAt,
          parsed.endAt,
          parsed.allDay,
          newEtag,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO events (source_id, title, description, location, start_at, end_at, all_day, category, caldav_href, caldav_etag)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'personnel', $8, $9)`,
        [
          sourceId,
          parsed.title,
          parsed.description,
          parsed.location,
          parsed.startAt,
          parsed.endAt,
          parsed.allDay,
          req.params.eventFile,
          newEtag,
        ]
      );
    }

    await client.query(
      'INSERT INTO caldav_sync_changes (source_id, caldav_href, change_type) VALUES ($1, $2, $3)',
      [sourceId, req.params.eventFile, changeType]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.setHeader('ETag', `"${newEtag}"`);
  res.status(existing ? 204 : 201).send();
});

router.delete('/calendars/:userId/personal/:eventFile', requireBasicAuth, async (req, res) => {
  if (req.params.userId !== req.caldavUserId) {
    return res.status(403).send();
  }

  const sourceId = await getOrCreateCaldavSource(req.caldavUserId!);

  const existingResult = await pool.query(
    'SELECT id, caldav_etag FROM events WHERE source_id = $1 AND caldav_href = $2',
    [sourceId, req.params.eventFile]
  );
  const existing = existingResult.rows[0];
  if (!existing) {
    return res.status(404).send();
  }

  const ifMatch = req.header('If-Match');
  if (ifMatch && `"${existing.caldav_etag}"` !== ifMatch) {
    return res.status(412).send();
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM events WHERE id = $1', [existing.id]);
    await client.query(
      "INSERT INTO caldav_sync_changes (source_id, caldav_href, change_type) VALUES ($1, $2, 'deleted')",
      [sourceId, req.params.eventFile]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.status(204).send();
});

export { router as caldavEventsRouter };
