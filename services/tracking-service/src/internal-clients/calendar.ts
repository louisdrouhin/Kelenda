import { signInternalRequest } from '@kelenda/shared';

export interface CreateCalendarEventInput {
  userId: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  category: 'ecole' | 'entreprise' | 'personnel';
}

export interface CalendarEventResult {
  id: string;
  start_at: string;
  end_at: string;
}

// Paire interne tracking-service → calendar-service, sur le même modèle que
// calendar-service → auth-service (doc section 5, "Authentification
// service-à-service") : secret dédié à cette paire, requête signée HMAC,
// anti-rejeu 30s. Utilisé pour qu'un suivi tuteur (visite/bilan/échange)
// apparaisse aussi comme événement dans le calendrier de l'utilisateur.
export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<CalendarEventResult> {
  const baseUrl = process.env.CALENDAR_SERVICE_INTERNAL_URL ?? 'http://localhost:3002';
  const secret = process.env.INTERNAL_SECRET_TRACKING_CALENDAR;
  if (!secret) {
    throw new Error('INTERNAL_SECRET_TRACKING_CALENDAR manquant');
  }

  const path = '/internal/events';
  const body = JSON.stringify({
    user_id: input.userId,
    title: input.title,
    description: input.description,
    location: input.location,
    start_at: input.startAt,
    end_at: input.endAt,
    category: input.category,
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
    throw new Error(`Échec de création de l'événement calendrier (${response.status})`);
  }

  return (await response.json()) as CalendarEventResult;
}
