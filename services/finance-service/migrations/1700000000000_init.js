/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- ------------------------------------------------------------
    -- salary_scales (barèmes SMIC/URSSAF — config versionnée dans le temps)
    -- ------------------------------------------------------------
    CREATE TABLE salary_scales (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        age_min          int NOT NULL,
        age_max          int,
        contract_year    int NOT NULL CHECK (contract_year BETWEEN 1 AND 4),
        diploma_level    text,
        smic_percentage  numeric(5,2),   -- ex: 43.00 = 43% du SMIC
        fixed_amount     numeric(10,2),  -- alternative si montant fixe
        valid_from       date NOT NULL,
        valid_to         date,
        source           text,
        created_at       timestamptz NOT NULL DEFAULT now(),
        CHECK (smic_percentage IS NOT NULL OR fixed_amount IS NOT NULL)
    );

    CREATE INDEX idx_salary_scales_lookup ON salary_scales(contract_year, age_min, age_max);

    -- ------------------------------------------------------------
    -- collective_agreements (conventions collectives, via API Légifrance/KALI)
    -- ------------------------------------------------------------
    CREATE TABLE collective_agreements (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        idcc_code   text NOT NULL UNIQUE,
        name        text NOT NULL,
        source_ref  text,
        fetched_at  timestamptz
    );

    -- ------------------------------------------------------------
    -- salary_simulations (historique conservé)
    -- ------------------------------------------------------------
    CREATE TABLE salary_simulations (
        id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         uuid NOT NULL,  -- réf. logique auth-service
        agreement_id    uuid REFERENCES collective_agreements(id),
        input_params    jsonb NOT NULL,  -- age, contract_year, diploma_level, siret...
        computed_gross  numeric(10,2) NOT NULL,
        computed_net    numeric(10,2) NOT NULL,
        computed_at     timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_salary_simulations_user_id ON salary_simulations(user_id);

    -- ------------------------------------------------------------
    -- prime_checks
    -- ------------------------------------------------------------
    CREATE TABLE prime_checks (
        id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         uuid NOT NULL,
        agreement_id    uuid NOT NULL REFERENCES collective_agreements(id),
        prime_type      text NOT NULL,  -- ex: 'prime_vacances'
        expected_amount numeric(10,2),
        status          text NOT NULL DEFAULT 'detected'
                        CHECK (status IN ('detected', 'confirmed_missing', 'resolved')),
        detected_at     timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_prime_checks_user_id ON prime_checks(user_id);

    -- ------------------------------------------------------------
    -- aid_matches
    -- ------------------------------------------------------------
    CREATE TABLE aid_matches (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id          uuid NOT NULL,
        input_params     jsonb NOT NULL,  -- âge, revenus, ville, statut fournis pour ce matching
        aid_name         text NOT NULL,  -- APL, prime_activite, mobili_jeune...
        eligibility_hint jsonb,
        redirect_url     text,
        matched_at       timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_aid_matches_user_id ON aid_matches(user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS aid_matches;
    DROP TABLE IF EXISTS prime_checks;
    DROP TABLE IF EXISTS salary_simulations;
    DROP TABLE IF EXISTS collective_agreements;
    DROP TABLE IF EXISTS salary_scales;
  `);
};
