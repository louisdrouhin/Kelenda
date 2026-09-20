/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    -- interaction_date passe de date à timestamptz : un suivi tuteur a
    -- désormais une heure (rendez-vous), pas juste un jour — nécessaire pour
    -- créer un événement calendrier correspondant avec des bornes horaires.
    ALTER TABLE tutor_interactions
      ALTER COLUMN interaction_date TYPE timestamptz
      USING interaction_date::timestamptz;

    -- Lien optionnel vers la mission concernée par ce suivi (même service,
    -- donc FK réelle possible — contrairement au lien vers calendar-service).
    ALTER TABLE tutor_interactions
      ADD COLUMN mission_id uuid REFERENCES missions(id) ON DELETE SET NULL;

    CREATE INDEX idx_tutor_interactions_mission_id ON tutor_interactions(mission_id);

    -- Référence logique (pas de FK, autre service/DB) vers l'événement créé
    -- dans calendar-service pour ce suivi, via l'appel interne
    -- tracking-service → calendar-service (routes/internal.ts côté calendar).
    ALTER TABLE tutor_interactions
      ADD COLUMN calendar_event_id uuid;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE tutor_interactions DROP COLUMN IF EXISTS calendar_event_id;
    ALTER TABLE tutor_interactions DROP COLUMN IF EXISTS mission_id;
    ALTER TABLE tutor_interactions
      ALTER COLUMN interaction_date TYPE date
      USING interaction_date::date;
  `);
};
