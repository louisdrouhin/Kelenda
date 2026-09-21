import { Router } from 'express';
import { pool } from '../db';
import { createInternalEvent } from '../internal-events';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

const VALID_CATEGORIES = ['ecole', 'entreprise', 'personnel'];

// source_type accompagne chaque événement pour que le frontend sache si
// l'édition/déplacement (drag & drop) est autorisé : seuls les événements de
// la source 'interne' (créés manuellement ou via suggestion acceptée) sont
// modifiables — un événement ics_ecole/ics_entreprise est en lecture seule
// côté Kelenda, sous peine d'être silencieusement écrasé au sync suivant.
const EVENT_COLUMNS = `e.id, e.source_id, s.type AS source_type, e.title, e.description, e.location,
       e.start_at, e.end_at, e.all_day, e.category, e.is_deadline, e.created_at, e.updated_at`;

router.get('/', requireAuth, async (req, res) => {
  const { from, to, category } = req.query;

  if (category !== undefined && (typeof category !== 'string' || !VALID_CATEGORIES.includes(category))) {
    return res.status(400).json({ error: `category doit être l'un de : ${VALID_CATEGORIES.join(', ')}` });
  }
  if (from !== undefined && (typeof from !== 'string' || Number.isNaN(Date.parse(from)))) {
    return res.status(400).json({ error: 'from doit être une date ISO valide' });
  }
  if (to !== undefined && (typeof to !== 'string' || Number.isNaN(Date.parse(to)))) {
    return res.status(400).json({ error: 'to doit être une date ISO valide' });
  }

  const result = await pool.query(
    `SELECT ${EVENT_COLUMNS}
     FROM events e
     JOIN calendar_sources s ON s.id = e.source_id
     WHERE s.user_id = $1
       AND ($2::timestamptz IS NULL OR e.end_at >= $2)
       AND ($3::timestamptz IS NULL OR e.start_at <= $3)
       AND ($4::text IS NULL OR e.category = $4)
     ORDER BY e.start_at ASC`,
    [req.auth!.sub, from ?? null, to ?? null, category ?? null]
  );

  return res.status(200).json(result.rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description, location, start_at, end_at, all_day, category } = req.body ?? {};

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
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category doit être l'un de : ${VALID_CATEGORIES.join(', ')}` });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ error: 'description doit être une chaîne' });
  }
  if (location !== undefined && typeof location !== 'string') {
    return res.status(400).json({ error: 'location doit être une chaîne' });
  }
  if (all_day !== undefined && typeof all_day !== 'boolean') {
    return res.status(400).json({ error: 'all_day doit être un booléen' });
  }

  // Les événements créés manuellement (hors sync ICS/CalDAV) vivent sous la
  // source interne du user, la même que celle des suggestions de révision
  // acceptées (doc section 11 / free-slots.ts) et des événements créés par un
  // autre service (routes/internal.ts) — un seul point d'entrée pour
  // "l'événement n'existe dans aucun calendrier externe" (voir internal-events.ts).
  const event = await createInternalEvent({
    userId: req.auth!.sub,
    title,
    description,
    location,
    startAt: start_at,
    endAt: end_at,
    allDay: all_day,
    category,
  });

  return res.status(201).json({ ...event, source_type: 'interne' });
});

router.get('/:id', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT ${EVENT_COLUMNS}
     FROM events e
     JOIN calendar_sources s ON s.id = e.source_id
     WHERE e.id = $1 AND s.user_id = $2`,
    [req.params.id, req.auth!.sub]
  );

  const event = result.rows[0];
  if (!event) {
    return res.status(404).json({ error: 'Événement introuvable' });
  }

  return res.status(200).json(event);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { title, description, location, start_at, end_at, all_day, category, is_deadline } = req.body ?? {};

  // is_deadline reste modifiable même sur un événement synchronisé (c'est une
  // annotation Kelenda, pas une donnée du calendrier source) ; tous les
  // autres champs exigent la source 'interne' (voir requête plus bas).
  const editingScheduleOrContent =
    title !== undefined ||
    description !== undefined ||
    location !== undefined ||
    start_at !== undefined ||
    end_at !== undefined ||
    all_day !== undefined ||
    category !== undefined;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({ error: 'title doit être une chaîne non vide' });
  }
  if (start_at !== undefined && (typeof start_at !== 'string' || Number.isNaN(Date.parse(start_at)))) {
    return res.status(400).json({ error: 'start_at doit être une date ISO valide' });
  }
  if (end_at !== undefined && (typeof end_at !== 'string' || Number.isNaN(Date.parse(end_at)))) {
    return res.status(400).json({ error: 'end_at doit être une date ISO valide' });
  }
  if (start_at !== undefined && end_at !== undefined && new Date(start_at) >= new Date(end_at)) {
    return res.status(400).json({ error: 'start_at doit être antérieur à end_at' });
  }
  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category doit être l'un de : ${VALID_CATEGORIES.join(', ')}` });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ error: 'description doit être une chaîne' });
  }
  if (location !== undefined && typeof location !== 'string') {
    return res.status(400).json({ error: 'location doit être une chaîne' });
  }
  if (all_day !== undefined && typeof all_day !== 'boolean') {
    return res.status(400).json({ error: 'all_day doit être un booléen' });
  }
  if (is_deadline !== undefined && typeof is_deadline !== 'boolean') {
    return res.status(400).json({ error: 'is_deadline doit être un booléen' });
  }

  // start_at/end_at doivent être cohérents même si un seul des deux est
  // fourni (ex: drag qui ne bouge que start_at) — on vérifie contre la valeur
  // actuelle en base dans ce cas.
  if ((start_at !== undefined) !== (end_at !== undefined)) {
    const current = await pool.query('SELECT start_at, end_at FROM events WHERE id = $1', [req.params.id]);
    const row = current.rows[0];
    if (row) {
      const nextStart = start_at !== undefined ? new Date(start_at) : new Date(row.start_at);
      const nextEnd = end_at !== undefined ? new Date(end_at) : new Date(row.end_at);
      if (nextStart >= nextEnd) {
        return res.status(400).json({ error: 'start_at doit être antérieur à end_at' });
      }
    }
  }

  const result = await pool.query(
    `UPDATE events e
     SET title = COALESCE($3, title),
         description = COALESCE($4, description),
         location = COALESCE($5, location),
         start_at = COALESCE($6, start_at),
         end_at = COALESCE($7, end_at),
         all_day = COALESCE($8, all_day),
         category = COALESCE($9, category),
         is_deadline = COALESCE($10, is_deadline)
     FROM calendar_sources s
     WHERE e.id = $1 AND e.source_id = s.id AND s.user_id = $2
       AND (NOT $11 OR s.type = 'interne')
     RETURNING ${EVENT_COLUMNS}`,
    [
      req.params.id,
      req.auth!.sub,
      title ?? null,
      description ?? null,
      location ?? null,
      start_at ?? null,
      end_at ?? null,
      all_day ?? null,
      category ?? null,
      is_deadline ?? null,
      editingScheduleOrContent,
    ]
  );

  const event = result.rows[0];
  if (!event) {
    return res.status(404).json({ error: 'Événement introuvable ou non modifiable (source externe)' });
  }

  return res.status(200).json(event);
});

router.delete('/:id', requireAuth, async (req, res) => {
  // Seuls les événements de la source interne (créés manuellement, ou issus
  // d'une suggestion de révision acceptée) sont supprimables — un événement
  // synchronisé depuis un ICS externe se retire en le retirant de la source
  // (école/entreprise), pas en le supprimant côté Kelenda.
  const result = await pool.query(
    `DELETE FROM events e
     USING calendar_sources s
     WHERE e.id = $1 AND e.source_id = s.id AND s.user_id = $2 AND s.type = 'interne'
     RETURNING e.id`,
    [req.params.id, req.auth!.sub]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Événement introuvable ou non supprimable' });
  }

  return res.status(204).send();
});

export { router as eventsRouter };
