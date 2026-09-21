import { Router } from 'express';
import { pool } from '../db';
import { requireInternalCaller } from '../middleware/require-internal-caller';
import { sendEmail } from '../senders/email-sender';

const router = Router();

// Email de confirmation à un tiers externe (tuteur) — hors du pipeline
// événement/préférences de dispatcher.ts, qui suppose un destinataire
// Kelenda (user_id avec ses propres préférences de canal). Un tuteur n'a pas
// de compte Kelenda : l'appelant (tracking-service) fournit directement
// l'adresse et le contenu, sans détour par NATS.
router.post('/send-tutor-email', requireInternalCaller, async (req, res) => {
  const { user_id, to, subject, text } = req.body ?? {};

  if (typeof user_id !== 'string' || user_id.trim() === '') {
    return res.status(400).json({ error: 'user_id est requis' });
  }
  if (typeof to !== 'string' || to.trim() === '') {
    return res.status(400).json({ error: 'to est requis' });
  }
  if (typeof subject !== 'string' || subject.trim() === '') {
    return res.status(400).json({ error: 'subject est requis' });
  }
  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'text est requis' });
  }

  try {
    await sendEmail(to, subject, text);
    await pool.query(
      `INSERT INTO notification_logs (user_id, event_type, channel, status, payload_snapshot, sent_at)
       VALUES ($1, 'tutor_confirmation_email', 'email', 'sent', $2, now())`,
      [user_id, JSON.stringify({ to, subject })]
    );
    return res.status(200).json({ sent: true });
  } catch (err) {
    await pool.query(
      `INSERT INTO notification_logs (user_id, event_type, channel, status, payload_snapshot)
       VALUES ($1, 'tutor_confirmation_email', 'email', 'failed', $2)`,
      [user_id, JSON.stringify({ to, subject })]
    );
    console.error('Échec envoi email tuteur :', err);
    return res.status(502).json({ error: "Échec de l'envoi de l'email" });
  }
});

export { router as internalRouter };
