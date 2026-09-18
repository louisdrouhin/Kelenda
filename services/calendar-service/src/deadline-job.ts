import { publishEvent } from '@kelenda/shared';
import { pool } from './db';

// Paliers de notification progressive (A.4) : "plusieurs jours avant, pas
// seulement la veille" — la doc ne fixe pas de valeurs précises, celles-ci
// sont ajustables sans migration (pas stockées en DB).
export const DEADLINE_NOTICE_DAYS = [7, 3, 1, 0];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface DeadlineCandidate {
  id: string;
  title: string;
  start_at: string;
  user_id: string;
}

// Nombre de jours CALENDAIRES avant le jour de l'échéance (comparaison à
// minuit UTC, indépendante de l'heure exacte de l'événement) — un examen à
// 14h "dans 7 jours et quelques heures" doit matcher le palier 7, pas 8
// (ce que donnerait un Math.ceil sur la durée exacte en millisecondes).
function daysBeforeStart(startAt: Date, now: Date): number {
  const startDay = Date.UTC(startAt.getUTCFullYear(), startAt.getUTCMonth(), startAt.getUTCDate());
  const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((startDay - nowDay) / MS_PER_DAY);
}

// Scanne les events is_deadline à venir, détermine si l'un des paliers
// DEADLINE_NOTICE_DAYS est atteint aujourd'hui, et publie deadline_approaching
// une seule fois par (event, palier) — déduplication via
// deadline_notifications_sent (PRIMARY KEY (event_id, days_before), voir
// migration 1700000005000). Conçu pour tourner en boucle (cf. startDeadlineJob).
export async function runDeadlineCheck(now: Date = new Date()): Promise<number> {
  const natsUrl = process.env.NATS_URL;
  if (!natsUrl) {
    console.warn('deadline-job: NATS_URL manquant, aucun événement ne sera publié');
    return 0;
  }

  const maxDays = Math.max(...DEADLINE_NOTICE_DAYS);
  const horizon = new Date(now.getTime() + (maxDays + 1) * MS_PER_DAY);

  const result = await pool.query<DeadlineCandidate>(
    `SELECT e.id, e.title, e.start_at, s.user_id
     FROM events e
     JOIN calendar_sources s ON s.id = e.source_id
     WHERE e.is_deadline = true
       AND e.start_at >= $1
       AND e.start_at <= $2`,
    [now, horizon]
  );

  let publishedCount = 0;

  for (const event of result.rows) {
    const daysBefore = daysBeforeStart(new Date(event.start_at), now);
    if (!DEADLINE_NOTICE_DAYS.includes(daysBefore)) continue;

    const inserted = await pool.query(
      `INSERT INTO deadline_notifications_sent (event_id, days_before)
       VALUES ($1, $2)
       ON CONFLICT (event_id, days_before) DO NOTHING
       RETURNING event_id`,
      [event.id, daysBefore]
    );
    if (inserted.rowCount === 0) continue; // déjà notifié pour ce palier

    await publishEvent(natsUrl, 'calendar', 'deadline_approaching', {
      user_id: event.user_id,
      event_id: event.id,
      event_title: event.title,
      event_start_at: event.start_at,
      days_before: daysBefore,
    });
    publishedCount += 1;
  }

  return publishedCount;
}

export function startDeadlineJob(intervalMs = 60 * 60 * 1000): NodeJS.Timeout {
  const timer = setInterval(() => {
    runDeadlineCheck().catch((err) => console.error('deadline-job failed:', err));
  }, intervalMs);
  // Ne bloque pas l'arrêt du process si c'est le seul timer actif restant.
  timer.unref();
  return timer;
}
