import { subscribeToEvent } from '@kelenda/shared';
import { dispatchNotification } from './dispatcher';
import { NotifiableEventType } from './event-types';

// Sujet NATS par événement (doc section 11, buildSubject() :
// kelenda.<emitting_service>.<event_type>) — un abonnement dédié par
// événement plutôt qu'un wildcard groupé façon `{a,b,c}` (NATS ne supporte
// que * et > comme wildcards, pas les groupes façon shell) : plus explicite,
// et un événement futur non listé ici n'est jamais traité par erreur.
const SUBJECT_BY_EVENT_TYPE: Record<NotifiableEventType, string> = {
  deadline_approaching: 'kelenda.calendar.deadline_approaching',
  conflit_planning_detecte: 'kelenda.calendar.conflit_planning_detecte',
  prime_manquante_detectee: 'kelenda.finance.prime_manquante_detectee',
  aide_disponible_detectee: 'kelenda.finance.aide_disponible_detectee',
  tutor_interaction_upcoming: 'kelenda.tracking.tutor_interaction_upcoming',
  rapport_genere: 'kelenda.tracking.rapport_genere',
  rapport_a_generer_bientot: 'kelenda.tracking.rapport_a_generer_bientot',
  user_registered: 'kelenda.auth.user_registered',
  mission_creee: 'kelenda.tracking.mission_creee',
};

export async function startEventConsumer(): Promise<void> {
  const natsUrl = process.env.NATS_URL;
  if (!natsUrl) {
    console.warn('NATS_URL non défini — les événements ne seront pas consommés');
    return;
  }

  for (const [eventType, subject] of Object.entries(SUBJECT_BY_EVENT_TYPE)) {
    await subscribeToEvent<Record<string, unknown>>(natsUrl, subject, async (envelope) => {
      await dispatchNotification(eventType as NotifiableEventType, envelope.payload);
    });
  }

  console.log(`notification-service abonné à ${Object.keys(SUBJECT_BY_EVENT_TYPE).length} sujets NATS`);
}
