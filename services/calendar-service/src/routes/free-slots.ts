import { publishEvent } from '@kelenda/shared';
import { Router } from 'express';
import { pool } from '../db';
import { computeFreeSlots, type BusyInterval } from '../free-slots';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

const DEFAULT_MIN_DURATION_MINUTES = 60;
const DEFAULT_WORKING_HOURS_START = 8;
const DEFAULT_WORKING_HOURS_END = 22;

router.get('/', requireAuth, async (req, res) => {
  const { from, to, min_duration_minutes, working_hours_start, working_hours_end } = req.query;

  if (typeof from !== 'string' || Number.isNaN(Date.parse(from))) {
    return res.status(400).json({ error: 'from doit être une date ISO valide' });
  }
  if (typeof to !== 'string' || Number.isNaN(Date.parse(to))) {
    return res.status(400).json({ error: 'to doit être une date ISO valide' });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (fromDate >= toDate) {
    return res.status(400).json({ error: 'from doit être antérieur à to' });
  }

  const minDurationMinutes = parseIntParam(min_duration_minutes, DEFAULT_MIN_DURATION_MINUTES);
  const workingHoursStart = parseIntParam(working_hours_start, DEFAULT_WORKING_HOURS_START);
  const workingHoursEnd = parseIntParam(working_hours_end, DEFAULT_WORKING_HOURS_END);

  if (minDurationMinutes === null || minDurationMinutes <= 0) {
    return res.status(400).json({ error: 'min_duration_minutes doit être un entier positif' });
  }
  if (
    workingHoursStart === null ||
    workingHoursEnd === null ||
    workingHoursStart < 0 ||
    workingHoursStart > 23 ||
    workingHoursEnd < 1 ||
    workingHoursEnd > 24 ||
    workingHoursStart >= workingHoursEnd
  ) {
    return res.status(400).json({ error: 'working_hours_start/end invalides (0-23, start < end)' });
  }

  // Seuls 'ecole' et 'entreprise' bloquent un créneau — le 'personnel' (temps déjà pris pour
  // soi) n'est volontairement pas exclu ici : proposer un créneau par-dessus un événement
  // personnel reste au choix de l'utilisateur, contrairement à un cours ou une réunion.
  const busyResult = await pool.query(
    `SELECT e.start_at, e.end_at
     FROM events e
     JOIN calendar_sources s ON s.id = e.source_id
     WHERE s.user_id = $1
       AND e.category IN ('ecole', 'entreprise')
       AND e.end_at > $2
       AND e.start_at < $3`,
    [req.auth!.sub, fromDate, toDate]
  );

  const busy: BusyInterval[] = busyResult.rows.map((row) => ({
    start: new Date(row.start_at),
    end: new Date(row.end_at),
  }));

  const slots = computeFreeSlots(
    { from: fromDate, to: toDate, minDurationMinutes, workingHoursStart, workingHoursEnd },
    busy
  );

  return res.status(200).json(slots);
});

router.post('/accept', requireAuth, async (req, res) => {
  const { title, start_at, end_at } = req.body ?? {};

  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'title est requis' });
  }
  if (typeof start_at !== 'string' || Number.isNaN(Date.parse(start_at))) {
    return res.status(400).json({ error: 'start_at doit être une date ISO valide' });
  }
  if (typeof end_at !== 'string' || Number.isNaN(Date.parse(end_at))) {
    return res.status(400).json({ error: 'end_at doit être une date ISO valide' });
  }
  if (new Date(start_at) >= new Date(end_at)) {
    return res.status(400).json({ error: 'start_at doit être antérieur à end_at' });
  }

  const client = await pool.connect();
  let event;
  try {
    await client.query('BEGIN');

    const sourceResult = await client.query(
      `INSERT INTO calendar_sources (user_id, type, label)
       VALUES ($1, 'interne', 'Suggestions Kelenda')
       ON CONFLICT (user_id) WHERE type = 'interne' DO NOTHING
       RETURNING id`,
      [req.auth!.sub]
    );

    let sourceId = sourceResult.rows[0]?.id;
    if (!sourceId) {
      const existing = await client.query(
        "SELECT id FROM calendar_sources WHERE user_id = $1 AND type = 'interne'",
        [req.auth!.sub]
      );
      sourceId = existing.rows[0].id;
    }

    const eventResult = await client.query(
      `INSERT INTO events (source_id, title, start_at, end_at, category)
       VALUES ($1, $2, $3, $4, 'personnel')
       RETURNING id, title, start_at, end_at`,
      [sourceId, title, start_at, end_at]
    );
    event = eventResult.rows[0];

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  if (process.env.NATS_URL) {
    await publishEvent(process.env.NATS_URL, 'calendar', 'mission_scheduled', {
      user_id: req.auth!.sub,
      event_id: event.id,
      title: event.title,
      start_at: event.start_at,
      end_at: event.end_at,
    });
  }

  return res.status(201).json(event);
});

function parseIntParam(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== 'string') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export { router as freeSlotsRouter };
