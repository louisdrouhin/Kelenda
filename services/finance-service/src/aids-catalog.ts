// B.3 — repérage des aides financières. Doc section 3 : "pas de source
// officielle unique identifiée pour automatiser l'éligibilité" — le MVP ne
// recalcule donc PAS l'éligibilité réelle, il applique des heuristiques
// simples (âge, statut) pour suggérer des pistes, puis redirige vers les
// simulateurs officiels pour le calcul définitif (doc section 5).

export interface AidCriteria {
  age?: number;
  monthlyIncome?: number;
  city?: string;
  status?: string; // 'apprenti', 'etudiant', 'salarie'...
}

export interface AidDefinition {
  name: string;
  redirectUrl: string;
  isEligible: (criteria: AidCriteria) => boolean;
  hint: (criteria: AidCriteria) => string;
}

const KNOWN_AIDS: AidDefinition[] = [
  {
    name: 'APL',
    redirectUrl: 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/logement/les-aides-au-logement',
    // Heuristique large : quasi tout le monde peut potentiellement y être
    // éligible sous conditions de ressources précises, non calculables ici.
    isEligible: () => true,
    hint: () =>
      'Éligibilité réelle dépendant du loyer, des ressources et du logement — à vérifier sur le simulateur officiel CAF.',
  },
  {
    name: 'prime_activite',
    redirectUrl: 'https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/complement-de-revenus/la-prime-dactivite',
    isEligible: (c) => (c.age ?? 0) >= 18,
    hint: () => 'Ouverte dès 18 ans avec un revenu d\'activité — montant précis à vérifier sur le simulateur CAF.',
  },
  {
    name: 'mobili_jeune',
    redirectUrl: 'https://www.actionlogement.fr/laide-mobili-jeune',
    isEligible: (c) => c.status === 'apprenti' && (c.age ?? 0) < 30,
    hint: () => 'Réservée aux alternants de moins de 30 ans en entreprise du secteur privé non agricole.',
  },
];

export function matchAids(criteria: AidCriteria): AidDefinition[] {
  return KNOWN_AIDS.filter((aid) => aid.isEligible(criteria));
}
