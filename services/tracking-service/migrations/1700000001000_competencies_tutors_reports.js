/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    -- ------------------------------------------------------------
    -- competency_frameworks (référentiel par école, ex. CESI)
    -- ------------------------------------------------------------
    CREATE TABLE competency_frameworks (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        school_name text NOT NULL,
        version     text NOT NULL,
        created_at  timestamptz NOT NULL DEFAULT now(),
        UNIQUE (school_name, version)
    );

    -- ------------------------------------------------------------
    -- competency_nodes (structure arborescente : domaine > sous-domaine > compétence)
    -- ------------------------------------------------------------
    CREATE TABLE competency_nodes (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        framework_id  uuid NOT NULL REFERENCES competency_frameworks(id) ON DELETE CASCADE,
        parent_id     uuid REFERENCES competency_nodes(id) ON DELETE CASCADE,
        code          text NOT NULL,
        label         text NOT NULL,
        UNIQUE (framework_id, code)
    );

    CREATE INDEX idx_competency_nodes_parent_id ON competency_nodes(parent_id);

    -- ------------------------------------------------------------
    -- competency_entries (progression de l'utilisateur)
    -- ------------------------------------------------------------
    CREATE TABLE competency_entries (
        id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             uuid NOT NULL,
        competency_node_id  uuid NOT NULL REFERENCES competency_nodes(id) ON DELETE CASCADE,
        level_achieved      text,
        last_updated_at     timestamptz NOT NULL DEFAULT now(),
        UNIQUE (user_id, competency_node_id)
    );

    CREATE INDEX idx_competency_entries_user_id ON competency_entries(user_id);

    -- ------------------------------------------------------------
    -- mission_competency_links (many-to-many)
    -- ------------------------------------------------------------
    CREATE TABLE mission_competency_links (
        mission_id          uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
        competency_node_id  uuid NOT NULL REFERENCES competency_nodes(id) ON DELETE CASCADE,
        PRIMARY KEY (mission_id, competency_node_id)
    );

    -- ------------------------------------------------------------
    -- tutors
    -- ------------------------------------------------------------
    CREATE TABLE tutors (
        id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             uuid NOT NULL,
        type                text NOT NULL CHECK (type IN ('entreprise', 'pedagogique')),
        name                text NOT NULL,
        email               text,
        phone               text,
        availability_notes  text
    );

    CREATE INDEX idx_tutors_user_id ON tutors(user_id);

    -- ------------------------------------------------------------
    -- tutor_interactions
    -- ------------------------------------------------------------
    CREATE TABLE tutor_interactions (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tutor_id         uuid NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
        interaction_date date NOT NULL,
        type             text NOT NULL CHECK (type IN ('visite', 'bilan', 'echange')),
        notes            text,
        created_at       timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_tutor_interactions_tutor_id ON tutor_interactions(tutor_id);

    -- ------------------------------------------------------------
    -- activity_reports
    -- ------------------------------------------------------------
    CREATE TABLE activity_reports (
        id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id           uuid NOT NULL,
        period_start      date NOT NULL,
        period_end        date NOT NULL,
        generated_at      timestamptz NOT NULL DEFAULT now(),
        format            text NOT NULL DEFAULT 'pdf',
        content_snapshot  jsonb
    );

    CREATE INDEX idx_activity_reports_user_id ON activity_reports(user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS activity_reports;
    DROP TABLE IF EXISTS tutor_interactions;
    DROP TABLE IF EXISTS tutors;
    DROP TABLE IF EXISTS mission_competency_links;
    DROP TABLE IF EXISTS competency_entries;
    DROP TABLE IF EXISTS competency_nodes;
    DROP TABLE IF EXISTS competency_frameworks;
  `);
};
