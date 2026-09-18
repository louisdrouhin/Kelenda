/* eslint-disable camelcase */

exports.shorthands = undefined;

// Barème officiel de rémunération des apprentis (% du SMIC par tranche d'âge
// × année de contrat), source service-public.fr, valeurs vérifiées au
// 2026-09-19 (SMIC brut mensuel : 1867.02 € au 1er juin 2026).
// "Année de contrat" = ancienneté dans LE contrat d'apprentissage, pas
// l'année civile ni le niveau de diplôme (d'où diploma_level = NULL : le
// barème légal de base n'en dépend pas — les majorations conventionnelles
// éventuelles sont un sujet distinct, couvert par prime_checks).
//
// contract_year=4 : pas de palier officiel au-delà de la 3e année pour un
// contrat d'apprentissage classique (les contrats de 4 ans concernent des cas
// spécifiques comme le handicap) — on réutilise le taux de la 3e année plutôt
// que de laisser un trou, en le documentant explicitement ici plutôt que
// dans le code applicatif.
exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO salary_scales (age_min, age_max, contract_year, diploma_level, smic_percentage, valid_from, source) VALUES
      -- Moins de 18 ans
      (16, 17, 1, NULL, 27.00, '2026-06-01', 'service-public.fr'),
      (16, 17, 2, NULL, 39.00, '2026-06-01', 'service-public.fr'),
      (16, 17, 3, NULL, 55.00, '2026-06-01', 'service-public.fr'),
      (16, 17, 4, NULL, 55.00, '2026-06-01', 'service-public.fr (année 4 = taux année 3, pas de palier officiel au-delà)'),

      -- 18-20 ans
      (18, 20, 1, NULL, 43.00, '2026-06-01', 'service-public.fr'),
      (18, 20, 2, NULL, 51.00, '2026-06-01', 'service-public.fr'),
      (18, 20, 3, NULL, 67.00, '2026-06-01', 'service-public.fr'),
      (18, 20, 4, NULL, 67.00, '2026-06-01', 'service-public.fr (année 4 = taux année 3, pas de palier officiel au-delà)'),

      -- 21-25 ans
      (21, 25, 1, NULL, 53.00, '2026-06-01', 'service-public.fr'),
      (21, 25, 2, NULL, 61.00, '2026-06-01', 'service-public.fr'),
      (21, 25, 3, NULL, 78.00, '2026-06-01', 'service-public.fr'),
      (21, 25, 4, NULL, 78.00, '2026-06-01', 'service-public.fr (année 4 = taux année 3, pas de palier officiel au-delà)'),

      -- 26 ans et plus (age_max NULL = pas de plafond)
      (26, NULL, 1, NULL, 100.00, '2026-06-01', 'service-public.fr'),
      (26, NULL, 2, NULL, 100.00, '2026-06-01', 'service-public.fr'),
      (26, NULL, 3, NULL, 100.00, '2026-06-01', 'service-public.fr'),
      (26, NULL, 4, NULL, 100.00, '2026-06-01', 'service-public.fr');
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM salary_scales WHERE source LIKE 'service-public.fr%';`);
};
