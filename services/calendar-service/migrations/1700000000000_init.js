/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- ------------------------------------------------------------
    -- calendar_sources
    -- ------------------------------------------------------------
    CREATE TABLE calendar_sources (
        id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id               uuid NOT NULL,  -- réf. logique auth-service
        type                  text NOT NULL
                              -- 'interne' : source virtuelle, un seul par utilisateur, pour les
                              -- événements créés par Kelenda lui-même (ex. suggestion de révision
                              -- acceptée) — aucun flux externe, pas de sync associée.
                              CHECK (type IN ('ics_ecole', 'ics_entreprise', 'caldav_perso', 'interne')),
        label                 text,
        url                   text,
        credentials_encrypted bytea,          -- pour CalDAV authentifié
        last_synced_at        timestamptz,
        sync_status           text NOT NULL DEFAULT 'pending'
                              CHECK (sync_status IN ('pending', 'ok', 'error')),
        created_at            timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_calendar_sources_user_id ON calendar_sources(user_id);

    -- ------------------------------------------------------------
    -- events
    -- ------------------------------------------------------------
    CREATE TABLE events (
        id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id      uuid NOT NULL REFERENCES calendar_sources(id) ON DELETE CASCADE,
        external_uid   text,                  -- UID ICS, pour dédup au resync
        title          text NOT NULL,
        description    text,
        location       text,
        start_at       timestamptz NOT NULL,
        end_at         timestamptz NOT NULL,
        all_day        boolean NOT NULL DEFAULT false,
        category       text NOT NULL
                       CHECK (category IN ('ecole', 'entreprise', 'personnel')),
        raw_ics_data   jsonb,
        -- colonne générée pour la détection de chevauchements (index GiST)
        -- '[)' (fermé-ouvert) : un événement qui finit à 12h00 et un autre qui commence à 12h00
        -- ne sont PAS considérés en conflit (convention standard Postgres pour les intervalles temporels)
        during         tstzrange GENERATED ALWAYS AS (tstzrange(start_at, end_at, '[)')) STORED,
        created_at     timestamptz NOT NULL DEFAULT now(),
        updated_at     timestamptz NOT NULL DEFAULT now(),
        UNIQUE (source_id, external_uid)
    );

    CREATE INDEX idx_events_source_id ON events(source_id);
    CREATE INDEX idx_events_start_at ON events(start_at);
    CREATE INDEX idx_events_during_gist ON events USING gist (during);

    CREATE TRIGGER trg_events_updated_at
        BEFORE UPDATE ON events
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    -- ------------------------------------------------------------
    -- detected_conflicts (persisté avec statut — évite de re-notifier)
    -- ------------------------------------------------------------
    CREATE TABLE detected_conflicts (
        id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_a_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        event_b_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        status       text NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open', 'resolved', 'dismissed')),
        detected_at  timestamptz NOT NULL DEFAULT now(),
        resolved_at  timestamptz,
        CHECK (event_a_id <> event_b_id),
        UNIQUE (event_a_id, event_b_id)
    );

    CREATE INDEX idx_detected_conflicts_status ON detected_conflicts(status);

    -- ------------------------------------------------------------
    -- commute_estimates (cache — évite de rappeler l'API trajet à chaque lecture)
    -- ------------------------------------------------------------
    CREATE TABLE commute_estimates (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        from_event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        to_event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        duration_minutes int NOT NULL,
        mode             text NOT NULL DEFAULT 'driving',
        computed_at      timestamptz NOT NULL DEFAULT now(),
        UNIQUE (from_event_id, to_event_id)
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS commute_estimates;
    DROP TABLE IF EXISTS detected_conflicts;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS calendar_sources;
    DROP FUNCTION IF EXISTS set_updated_at();
  `);
};
