// SMIC mensuel brut en vigueur — pas d'API temps réel officielle (doc section 5),
// mise à jour manuelle 1 à 2 fois par an. Valeur au 1er juin 2026, source service-public.fr.
export const SMIC_MONTHLY_GROSS = 1867.02;

// Taux de cotisations salariales appliqué pour dériver le net du brut.
// Simplification MVP : taux moyen pour un contrat d'apprentissage (les
// apprentis bénéficient d'exonérations spécifiques sous 50% du SMIC, doc
// section 5 — non modélisées finement ici, TODO si besoin de précision).
export const APPRENTICE_NET_RATIO = 0.9;
