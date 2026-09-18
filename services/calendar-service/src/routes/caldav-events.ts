import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { requireBasicAuth } from '../caldav/require-basic-auth';
import { parseVeventDocument } from '../caldav/ical-reader';
import { eventToIcsDocument } from '../caldav/ical-writer';
import { parseCalendarQueryTimeRange } from '../caldav/query-parser';
import { getOrCreateCaldavSource } from '../caldav/source';
import { buildMultistatus, buildResponse, xmlEscape } from '../caldav/xml';
import { pool } from '../db';

const router = Router();

const CALDAV_NS = 'urn:ietf:params:xml:ns:caldav';

function eventHref(userId: string, event: { caldav_href: string }): string {
  return `/calendar/caldav/calendars/${userId}/personal/${event.caldav_href}`;
}

router.report('/calendars/:userId/personal/', requireBasicAuth, async (req, res) => {
  if (req.params.userId !== req.caldavUserId) {
    return res.status(403).send();
  }

  const timeRange = await parseCalendarQueryTimeRange(typeof req.body === 'string' ? req.body : '');
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
