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
    -- missions
    -- ------------------------------------------------------------
    CREATE TABLE missions (
        id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           uuid NOT NULL,  -- réf. logique auth-service
        title             text NOT NULL,
        description       text,
        start_date        date NOT NULL,
        end_date          date,
        status            text NOT NULL DEFAULT 'in_progress'
                          CHECK (status IN ('in_progress', 'done', 'cancelled')),
        related_event_id  uuid,  -- réf. logique calendar-service.events.id (optionnel)
        source            text NOT NULL DEFAULT 'manual'
                          CHECK (source IN ('manual', 'suggested')),
        created_at        timestamptz NOT NULL DEFAULT now(),
        updated_at        timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_missions_user_id ON missions(user_id);

    CREATE TRIGGER trg_missions_updated_at
        BEFORE UPDATE ON missions
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS missions;
    DROP FUNCTION IF EXISTS set_updated_at();
  `);
};
