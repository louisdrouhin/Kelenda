import { subscribeToEvent } from '@kelenda/shared';
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

      await pool.query(
        `INSERT INTO missions (user_id, title, start_date, related_event_id, source)
         VALUES ($1, $2, $3::timestamptz::date, $4, 'suggested')`,
        [user_id, title, start_at, event_id]
      );
    }
  );

  console.log('tracking-service abonné à kelenda.calendar.mission_scheduled');
}
