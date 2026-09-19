// Catalogue complet des événements consommés par notification-service
// (doc section 11, "Récapitulatif des abonnements").
export const NOTIFIABLE_EVENT_TYPES = [
  'deadline_approaching',
  'conflit_planning_detecte',
  'prime_manquante_detectee',
  'aide_disponible_detectee',
  'tutor_interaction_upcoming',
  'rapport_genere',
  'rapport_a_generer_bientot',
  'user_registered',
] as const;

export type NotifiableEventType = (typeof NOTIFIABLE_EVENT_TYPES)[number];
