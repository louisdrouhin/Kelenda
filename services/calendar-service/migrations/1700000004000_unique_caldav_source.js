/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    -- Un seul calendrier caldav_perso par utilisateur (serveur CalDAV, un
    -- seul calendrier exposé pour ce MVP) — même pattern que l'index sur
    -- 'interne' (migration 1700000001000).
    CREATE UNIQUE INDEX idx_calendar_sources_one_caldav_perso_per_user
      ON calendar_sources (user_id)
      WHERE type = 'caldav_perso';
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_calendar_sources_one_caldav_perso_per_user;
  `);
};
