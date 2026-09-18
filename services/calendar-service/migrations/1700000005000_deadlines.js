/* eslint-disable camelcase */

exports.shorthands = undefined;

// A.4 — notifications progressives avant deadlines/examens. Le schéma
// 'events' ne distingue pas un examen d'un cours normal ; is_deadline est
// positionnable par l'utilisateur (PATCH /calendar/events/:id) pour marquer
// les événements qui doivent déclencher deadline_approaching.
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE events
      ADD COLUMN is_deadline boolean NOT NULL DEFAULT false;

    CREATE INDEX idx_events_is_deadline ON events(is_deadline) WHERE is_deadline;

    -- Trace les paliers déjà notifiés (J-7/J-3/J-1/J-0, voir deadline-job.ts)
    -- pour qu'un job qui tourne périodiquement ne renvoie jamais deux fois le
    -- même palier pour le même événement.
    CREATE TABLE deadline_notifications_sent (
        event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        days_before int NOT NULL,
        sent_at     timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (event_id, days_before)
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS deadline_notifications_sent;
    ALTER TABLE events DROP COLUMN IF EXISTS is_deadline;
  `);
};
