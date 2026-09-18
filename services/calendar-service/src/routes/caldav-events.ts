import { Router } from 'express';
import { requireBasicAuth } from '../caldav/require-basic-auth';
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

export { router as caldavEventsRouter };
