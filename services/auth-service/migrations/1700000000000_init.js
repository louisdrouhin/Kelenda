/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
    CREATE EXTENSION IF NOT EXISTS citext;     -- email insensible à la casse

    -- Fonction utilitaire réutilisée pour updated_at
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- ------------------------------------------------------------
    -- workspaces
    -- ------------------------------------------------------------
    CREATE TABLE workspaces (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name        text NOT NULL,
        created_at  timestamptz NOT NULL DEFAULT now()
    );

    -- ------------------------------------------------------------
    -- users
    -- ------------------------------------------------------------
    CREATE TABLE users (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        email         citext NOT NULL UNIQUE,
        display_name  text,
        status        text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'suspended')),
        created_at    timestamptz NOT NULL DEFAULT now(),
        updated_at    timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_users_workspace_id ON users(workspace_id);

    CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    -- ------------------------------------------------------------
    -- credentials (auth locale — 0..1 par user)
    -- ------------------------------------------------------------
    CREATE TABLE credentials (
        user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        password_hash text NOT NULL,
        created_at    timestamptz NOT NULL DEFAULT now(),
        updated_at    timestamptz NOT NULL DEFAULT now()
    );

    CREATE TRIGGER trg_credentials_updated_at
        BEFORE UPDATE ON credentials
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    -- ------------------------------------------------------------
    -- identities (providers OAuth — liaison manuelle uniquement)
    -- ------------------------------------------------------------
    CREATE TABLE identities (
        id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider                text NOT NULL
                                CHECK (provider IN ('google', 'microsoft', 'github')),
        provider_user_id        text NOT NULL,
        -- Tokens chiffrés (chiffrement applicatif recommandé avant insertion,
        -- ex. AES-256-GCM avec clé gérée hors DB / KMS ; bytea = résultat chiffré).
        access_token_encrypted  bytea,
        refresh_token_encrypted bytea,
        token_expires_at        timestamptz,
        linked_at               timestamptz NOT NULL DEFAULT now(),
        UNIQUE (provider, provider_user_id)
    );

    CREATE INDEX idx_identities_user_id ON identities(user_id);

    -- ------------------------------------------------------------
    -- sessions (refresh tokens)
    -- ------------------------------------------------------------
    CREATE TABLE sessions (
        id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash  text NOT NULL,
        device_info         text,
        expires_at          timestamptz NOT NULL,
        revoked_at          timestamptz,
        created_at          timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

    -- ------------------------------------------------------------
    -- revoked_tokens (blocklist JWT, optionnel — invalidation avant expiration naturelle)
    -- ------------------------------------------------------------
    CREATE TABLE revoked_tokens (
        jti         uuid PRIMARY KEY,
        user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        revoked_at  timestamptz NOT NULL DEFAULT now(),
        expires_at  timestamptz NOT NULL  -- pour un job de nettoyage périodique
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS revoked_tokens;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS identities;
    DROP TABLE IF EXISTS credentials;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS workspaces;
    DROP FUNCTION IF EXISTS set_updated_at();
  `);
};
