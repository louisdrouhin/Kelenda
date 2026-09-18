export interface CollectiveAgreementInfo {
  idccCode: string;
  name: string;
}

// siret2idcc (SocialGouv, https://github.com/SocialGouv/siret2idcc) — à
// partir d'un SIRET, renvoie la convention collective applicable. Source
// officielle (données DSN/KALI), gratuite, sans authentification.
//
// Remplace l'API Entreprise (entreprise.api.gouv.fr) initialement prévue par
// la doc section 5 : celle-ci exige ProConnect, réservé aux agents publics
// et organismes habilités — inaccessible pour un projet en phase de dev.
// Décision prise le 2026-09-19, documentée dans le suivi d'implémentation.
//
// Ne lève jamais : le SIRET est une donnée optionnelle du simulateur, son
// absence ou une indisponibilité de l'API ne doit jamais bloquer un calcul
// de salaire minimum légal (qui ne dépend que du barème SMIC).
export async function fetchCollectiveAgreementBySiret(siret: string): Promise<CollectiveAgreementInfo | null> {
  const baseUrl = process.env.SIRET2IDCC_BASE_URL ?? 'https://siret2idcc.fabrique.social.gouv.fr/api/v2';

  try {
    const response = await fetch(`${baseUrl}/${siret}`);

    if (!response.ok) {
      console.warn(`siret2idcc: échec de résolution du SIRET ${siret} (${response.status})`);
      return null;
    }

    const data = (await response.json()) as Array<{
      // 'num' est un NUMBER dans la réponse réelle (ex. 1486), pas une string
      // — vérifié par appel réel le 2026-09-19 (SIRET Partner Informatique,
      // origine personnelle du projet — bien sous convention Syntec IDCC 1486).
      conventions?: Array<{ num?: number; shortTitle?: string; title?: string; active?: boolean }>;
    }>;

    const conventions = data[0]?.conventions ?? [];
    const active = conventions.find((c) => c.active) ?? conventions[0];
    if (!active?.num) return null;

    const idccCode = String(active.num);
    return { idccCode, name: active.shortTitle ?? active.title ?? idccCode };
  } catch (err) {
    console.warn(`siret2idcc: erreur réseau pour le SIRET ${siret}`, err);
    return null;
  }
}
