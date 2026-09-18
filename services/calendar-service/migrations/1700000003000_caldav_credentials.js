/* eslint-disable camelcase */

exports.shorthands = undefined;

// Identifiants Basic Auth dédiés pour le serveur CalDAV — jamais le mot de
// passe du compte Kelenda (mauvaise pratique : impossible à révoquer
// séparément, exposé à chaque app tierce connectée). Un seul par utilisateur,
// régénérable (écrase l'ancien hash, invalidant l'ancien mot de passe).
//
// 'username' dénormalise l'email d'auth-service (hybrid data-transfer pattern,
// CLAUDE.md) : Basic Auth envoie un couple username/password en clair à
// CHAQUE requête WebDAV (PROPFIND, REPORT, PUT...), un rythme bien plus élevé
// qu'un login classique — appeler /internal/users/:id à chaque fois serait
// une charge inutile sur auth-service pour une donnée qui ne change quasiment
// jamais. UNIQUE car c'est la clé de recherche à l'authentification.
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE caldav_credentials (
        user_id        uuid PRIMARY KEY,  -- réf. logique auth-service
        username       text NOT NULL UNIQUE,
        password_hash  text NOT NULL,
        created_at     timestamptz NOT NULL DEFAULT now(),
        updated_at     timestamptz NOT NULL DEFAULT now()
    );

    CREATE TRIGGER trg_caldav_credentials_updated_at
        BEFORE UPDATE ON caldav_credentials
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS caldav_credentials;
  `);
};
