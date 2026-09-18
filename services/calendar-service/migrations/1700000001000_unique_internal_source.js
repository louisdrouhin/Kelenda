/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    -- 'interne' : source virtuelle, un seul par utilisateur (doc section 9.2).
    -- Index partiel plutôt qu'une contrainte UNIQUE (user_id, type) globale, qui
    -- interdirait à tort plusieurs sources ics_ecole/ics_entreprise/caldav_perso
    -- pour un même utilisateur.
    CREATE UNIQUE INDEX idx_calendar_sources_one_internal_per_user
      ON calendar_sources (user_id)
      WHERE type = 'interne';
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_calendar_sources_one_internal_per_user;
  `);
};
