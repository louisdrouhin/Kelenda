import { Router } from 'express';
import { pool } from '../db';
import { createCalendarEvent } from '../internal-clients/calendar';
import { sendTutorConfirmationEmail } from '../internal-clients/notification';
import { requireAuth } from '../middleware/require-auth';

const router = Router();

const VALID_TUTOR_TYPES = ['entreprise', 'pedagogique'];
const VALID_INTERACTION_TYPES = ['visite', 'bilan', 'echange'];
const INTERACTION_TYPE_LABELS: Record<string, string> = {
  visite: 'Visite tuteur',
  bilan: 'Bilan tuteur',
  echange: 'Échange tuteur',
};
const DEFAULT_INTERACTION_DURATION_MS = 60 * 60 * 1000;

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, user_id, type, name, email, phone, availability_notes
     FROM tutors
     WHERE user_id = $1
     ORDER BY name ASC`,
    [req.auth!.sub]
  );

  return res.status(200).json(result.rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { type, name, email, phone, availability_notes } = req.body ?? {};

  if (!VALID_TUTOR_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de : ${VALID_TUTOR_TYPES.join(', ')}` });
  }
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name est requis' });
  }

  const result = await pool.query(
    `INSERT INTO tutors (user_id, type, name, email, phone, availability_notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, type, name, email, phone, availability_notes`,
    [req.auth!.sub, type, name, email ?? null, phone ?? null, availability_notes ?? null]
  );

  return res.status(201).json(result.rows[0]);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { type, name, email, phone, availability_notes } = req.body ?? {};

  if (type !== undefined && !VALID_TUTOR_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de : ${VALID_TUTOR_TYPES.join(', ')}` });
  }
  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return res.status(400).json({ error: 'name doit être une chaîne non vide' });
  }

  const result = await pool.query(
    `UPDATE tutors
     SET type = COALESCE($3, type),
         name = COALESCE($4, name),
         email = COALESCE($5, email),
         phone = COALESCE($6, phone),
         availability_notes = COALESCE($7, availability_notes)
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, type, name, email, phone, availability_notes`,
    [req.params.id, req.auth!.sub, type ?? null, name ?? null, email ?? null, phone ?? null, availability_notes ?? null]
  );

  const tutor = result.rows[0];
  if (!tutor) {
    return res.status(404).json({ error: 'Tuteur introuvable' });
  }

  return res.status(200).json(tutor);
});

router.post('/:id/interactions', requireAuth, async (req, res) => {
  const { interaction_date, type, notes, mission_id } = req.body ?? {};

  if (typeof interaction_date !== 'string' || Number.isNaN(Date.parse(interaction_date))) {
    return res.status(400).json({ error: 'interaction_date doit être une date valide' });
  }
  if (!VALID_INTERACTION_TYPES.includes(type)) {
    return res.status(400).json({ error: `type doit être l'un de : ${VALID_INTERACTION_TYPES.join(', ')}` });
  }
  if (mission_id !== undefined && mission_id !== null && typeof mission_id !== 'string') {
    return res.status(400).json({ error: 'mission_id doit être une chaîne' });
  }

  const tutorResult = await pool.query('SELECT id, name, email FROM tutors WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.auth!.sub,
  ]);
  const tutor = tutorResult.rows[0];
  if (!tutor) {
    return res.status(404).json({ error: 'Tuteur introuvable' });
  }

  if (mission_id) {
    const missionResult = await pool.query('SELECT id FROM missions WHERE id = $1 AND user_id = $2', [
      mission_id,
      req.auth!.sub,
    ]);
    if (!missionResult.rows[0]) {
      return res.status(400).json({ error: 'mission_id ne correspond à aucune mission' });
    }
  }

  // Le suivi tuteur apparaît aussi dans le calendrier (catégorie 'entreprise')
  // pour que le rendez-vous soit visible aux côtés des cours/missions — voir
  // internal-clients/calendar.ts. Best-effort : si calendar-service est
  // injoignable, le suivi est quand même enregistré (calendar_event_id reste
  // NULL) plutôt que de bloquer l'utilisateur sur une dépendance inter-service.
  let calendarEventId: string | null = null;
  try {
    const startAt = new Date(interaction_date);
    const endAt = new Date(startAt.getTime() + DEFAULT_INTERACTION_DURATION_MS);
    const calendarEvent = await createCalendarEvent({
      userId: req.auth!.sub,
      title: `${INTERACTION_TYPE_LABELS[type]} — ${tutor.name}`,
      description: notes ?? undefined,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      category: 'entreprise',
    });
    calendarEventId = calendarEvent.id;
  } catch (err) {
    console.error('Échec de création de l\'événement calendrier pour ce suivi tuteur :', err);
  }

  // Email de confirmation au tuteur, uniquement s'il a une adresse renseignée
  // — best-effort comme l'événement calendrier ci-dessus : un échec SMTP ne
  // doit pas empêcher l'enregistrement du suivi.
  if (tutor.email) {
    try {
      const formattedDate = new Date(interaction_date).toLocaleString('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
      });
      await sendTutorConfirmationEmail({
        userId: req.auth!.sub,
        to: tutor.email,
        subject: `Confirmation — ${INTERACTION_TYPE_LABELS[type]}`,
        text: `Bonjour ${tutor.name},\n\nUn suivi de type "${INTERACTION_TYPE_LABELS[type]}" a été programmé le ${formattedDate}.\n\n${notes ? `Notes : ${notes}\n\n` : ''}Ceci est un message automatique envoyé depuis Kelenda.`,
      });
    } catch (err) {
      console.error("Échec d'envoi de l'email de confirmation au tuteur :", err);
    }
  }

  const result = await pool.query(
    `INSERT INTO tutor_interactions (tutor_id, interaction_date, type, notes, mission_id, calendar_event_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, tutor_id, interaction_date, type, notes, mission_id, calendar_event_id, created_at`,
    [req.params.id, interaction_date, type, notes ?? null, mission_id ?? null, calendarEventId]
  );

  return res.status(201).json(result.rows[0]);
});

router.get('/:id/interactions', requireAuth, async (req, res) => {
  const tutorResult = await pool.query('SELECT id FROM tutors WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.auth!.sub,
  ]);
  if (!tutorResult.rows[0]) {
    return res.status(404).json({ error: 'Tuteur introuvable' });
  }

  const result = await pool.query(
    `SELECT i.id, i.tutor_id, i.interaction_date, i.type, i.notes, i.mission_id, i.calendar_event_id, i.created_at,
            m.title AS mission_title
     FROM tutor_interactions i
     LEFT JOIN missions m ON m.id = i.mission_id
     WHERE i.tutor_id = $1
     ORDER BY i.interaction_date DESC`,
    [req.params.id]
  );

  return res.status(200).json(result.rows);
});

export { router as tutorsRouter };
