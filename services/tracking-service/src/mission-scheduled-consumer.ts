import { publishEvent, subscribeToEvent } from '@kelenda/shared';
import { pool } from './db';

interface MissionScheduledPayload {
  user_id: string;
  event_id: string;
  title: string;
  start_at: string;
  end_at: string;
}

// calendar-service crée l'événement `interne`/`personnel` et publie ce payload
// dès l'acceptation d'une suggestion de révision (A.2) — auto-suffisant, pas
// besoin d'appeler calendar-service pour construire la mission.
export async function startMissionScheduledConsumer(): Promise<void> {
  const natsUrl = process.env.NATS_URL;
  if (!natsUrl) {
    console.warn('NATS_URL non défini — mission_scheduled ne sera pas consommé');
    return;
  }

  await subscribeToEvent<MissionScheduledPayload>(
    natsUrl,
    'kelenda.calendar.mission_scheduled',
    async (envelope) => {
      const { user_id, event_id, title, start_at } = envelope.payload;

      const result = await pool.query(
        `INSERT INTO missions (user_id, title, start_date, related_event_id, source)
         VALUES ($1, $2, $3::timestamptz::date, $4, 'suggested')
         RETURNING id, start_date`,
        [user_id, title, start_at, event_id]
      );
      const mission = result.rows[0];

      // mission_creee (doc section 11, ajouté 2026-09-19) : notification-service
      // n'est pas abonné à mission_scheduled (auto-suffisant pour tracking-service
      // uniquement) — sans cet événement dédié, aucune notification n'informe
      // l'utilisateur qu'une mission a été créée automatiquement pour lui.
      await publishEvent(natsUrl, 'tracking', 'mission_creee', {
        user_id,
        mission_id: mission.id,
        title,
        start_date: mission.start_date,
      });
    }
  );

  console.log('tracking-service abonné à kelenda.calendar.mission_scheduled');
}
