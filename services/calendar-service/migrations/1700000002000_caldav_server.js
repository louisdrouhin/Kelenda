/* eslint-disable camelcase */

exports.shorthands = undefined;

// Schéma pour héberger un serveur CalDAV (RFC 4791 + RFC 6578 sync-collection).
// Kelenda EXPOSE un calendrier que des clients externes (app Calendrier iPhone/
// macOS, Google Calendar...) ajoutent et synchronisent — pas un client qui
// importe depuis un serveur externe (c'est déjà couvert par ics_ecole/
// ics_entreprise via /sync).
//
// Un utilisateur a exactement un calendrier CalDAV "perso" : la source
// 'caldav_perso' existante (calendar_sources.type) sert de collection
// WebDAV racine pour ce calendrier — pas besoin d'une nouvelle table de
// collections, une seule collection par utilisateur suffit pour ce MVP.
exports.up = (pgm) => {
  pgm.sql(`
    -- Chaque événement exposé via CalDAV a besoin d'un href WebDAV stable
    -- (indépendant de son id, pour survivre à un futur changement de schéma
    -- d'URL) et d'un etag qui change à CHAQUE modification (RFC 4791 §5.3.4 —
    -- les clients l'utilisent pour la synchro conditionnelle, If-Match/If-None-Match).
    ALTER TABLE events
      ADD COLUMN caldav_href text UNIQUE,
      ADD COLUMN caldav_etag uuid;

    -- ------------------------------------------------------------
    -- caldav_sync_changes : log des créations/modifications/suppressions,
    -- nécessaire pour RFC 6578 (REPORT sync-collection avec sync-token).
    -- On ne peut pas déduire "qu'est-ce qui a changé depuis le token X" en
    -- ne regardant que l'état courant de 'events' (une suppression n'y
    -- laisse aucune trace) — d'où ce log séparé, purgé périodiquement au-delà
    -- d'une fenêtre de rétention (pas géré ici, TODO job de nettoyage).
    -- ------------------------------------------------------------
    CREATE TABLE caldav_sync_changes (
        id            bigserial PRIMARY KEY,
        source_id     uuid NOT NULL REFERENCES calendar_sources(id) ON DELETE CASCADE,
        caldav_href   text NOT NULL,
        change_type   text NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted')),
        changed_at    timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_caldav_sync_changes_source_id_id ON caldav_sync_changes(source_id, id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS caldav_sync_changes;
    ALTER TABLE events
      DROP COLUMN IF EXISTS caldav_href,
      DROP COLUMN IF EXISTS caldav_etag;
  `);
};
