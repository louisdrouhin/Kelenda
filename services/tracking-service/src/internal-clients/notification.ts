import { signInternalRequest } from '@kelenda/shared';

// Paire interne tracking-service → notification-service, sur le même modèle
// que tracking-service → calendar-service (doc section 5, "Authentification
// service-à-service"). Envoie un email de confirmation à un tuteur — hors
// pipeline event/préférences (dispatcher.ts côté notification-service), qui
// suppose un destinataire Kelenda avec ses propres préférences de canal.
export async function sendTutorConfirmationEmail(input: {
  userId: string;
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const baseUrl = process.env.NOTIFICATION_SERVICE_INTERNAL_URL ?? 'http://localhost:3004';
  const secret = process.env.INTERNAL_SECRET_TRACKING_NOTIFICATION;
  if (!secret) {
    throw new Error('INTERNAL_SECRET_TRACKING_NOTIFICATION manquant');
  }

  const path = '/internal/send-tutor-email';
  const body = JSON.stringify({
    user_id: input.userId,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
  const headers = signInternalRequest('tracking-service', secret, 'POST', path, body);

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Calling-Service': headers['X-Calling-Service'],
      'X-Timestamp': headers['X-Timestamp'],
      'X-Signature': headers['X-Signature'],
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Échec d'envoi de l'email de confirmation au tuteur (${response.status})`);
  }
}
