import type { NotifiableEventType } from './event-types';

export interface NotificationMessage {
  title: string;
  body: string;
}

// Construit le texte affiché à l'utilisateur à partir du payload brut de
// chaque événement (doc section 11) — un seul point de vérité pour le
// contenu, partagé entre le canal web_push (title/body JSON) et email
// (subject/text).
export function buildMessage(eventType: NotifiableEventType, payload: Record<string, unknown>): NotificationMessage {
  switch (eventType) {
    case 'deadline_approaching':
      return {
        title: 'Échéance à venir',
        body: `« ${payload.event_title} » dans ${payload.days_before} jour(s) (${payload.event_start_at}).`,
      };
    case 'conflit_planning_detecte':
      return {
        title: 'Conflit de planning détecté',
        body: `« ${payload.event_a_title} » chevauche « ${payload.event_b_title} ».`,
      };
    case 'prime_manquante_detectee':
      return {
        title: 'Prime potentiellement manquante',
        body: `Une prime de type « ${payload.prime_type} » pourrait vous être due.`,
      };
    case 'aide_disponible_detectee':
      return {
        title: 'Aide financière disponible',
        body: `« ${payload.aid_name} » pourrait s'appliquer à votre situation.`,
      };
    case 'tutor_interaction_upcoming':
      return {
        title: 'Échange tuteur à venir',
        body: `${payload.type} avec ${payload.tutor_name} le ${payload.interaction_date}.`,
      };
    case 'rapport_genere':
      return {
        title: 'Rapport d\'activité généré',
        body: `Votre rapport du ${payload.period_start} au ${payload.period_end} est prêt.`,
      };
    case 'rapport_a_generer_bientot':
      return {
        title: 'Rapport d\'activité à générer',
        body: `Pensez à générer votre rapport pour la période du ${payload.period_start} au ${payload.period_end}.`,
      };
    case 'user_registered':
      return {
        title: 'Bienvenue sur Kelenda',
        body: `Bienvenue ${payload.display_name ?? ''}, votre compte est prêt.`.trim(),
      };
    case 'mission_creee':
      return {
        title: 'Nouvelle mission suggérée',
        body: `« ${payload.title} » a été ajoutée à votre suivi (${payload.start_date}).`,
      };
  }
}
