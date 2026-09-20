import { Router } from 'express';
import { createInternalEvent } from '../internal-events';
import { requireInternalCaller } from '../middleware/require-internal-caller';

const router = Router();

const VALID_CATEGORIES = ['ecole', 'entreprise', 'personnel'];

// Permet à un autre service (ex: tracking-service, pour un suivi tuteur) de
// créer un événement dans le calendrier d'un utilisateur sans passer par un
// JWT utilisateur — l'appel est authentifié service-à-service (HMAC, voir
// requireInternalCaller) et user_id est fourni explicitement dans le corps.
router.post('/events', requireInternalCaller, async (req, res) => {
  const { user_id, title, description, location, start_at, end_at, all_day, category } = req.body ?? {};

  if (typeof user_id !== 'string' || user_id.trim() === '') {
    return res.status(400).json({ error: 'user_id est requis' });
  }
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

  const event = await createInternalEvent({
    userId: user_id,
    title,
    description,
    location,
    startAt: start_at,
    endAt: end_at,
    allDay: all_day,
    category,
  });

  return res.status(201).json(event);
});

export { router as internalRouter };
