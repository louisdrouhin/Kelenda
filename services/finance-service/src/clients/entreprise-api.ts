export interface CollectiveAgreementInfo {
  idccCode: string;
  name: string;
}

// API Entreprise (entreprise.api.gouv.fr) — à partir d'un SIRET, renvoie la
// convention collective applicable (doc section 5, "Sources de données pour
// le simulateur salaire/droits"). Retourne null (jamais ne lève) si l'API
// n'est pas configurée ou échoue : le SIRET est une donnée optionnelle du
// simulateur, son absence ne doit jamais bloquer un calcul de salaire minimum
// légal (qui ne dépend que du barème SMIC).
export async function fetchCollectiveAgreementBySiret(siret: string): Promise<CollectiveAgreementInfo | null> {
  const baseUrl = process.env.ENTREPRISE_API_BASE_URL;
  const token = process.env.ENTREPRISE_API_TOKEN;

  if (!baseUrl || !token || token === 'CHANGE_ME') {
    console.warn('entreprise-api: ENTREPRISE_API_TOKEN non configuré, SIRET ignoré');
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/v3/etablissements/${siret}/convention_collective`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.warn(`entreprise-api: échec de résolution du SIRET ${siret} (${response.status})`);
      return null;
    }

    const data = (await response.json()) as {
      data?: { conventions_collectives?: Array<{ idcc?: string; titre?: string }> };
    };
    const convention = data.data?.conventions_collectives?.[0];
    if (!convention?.idcc) return null;

    return { idccCode: convention.idcc, name: convention.titre ?? convention.idcc };
  } catch (err) {
    console.warn(`entreprise-api: erreur réseau pour le SIRET ${siret}`, err);
    return null;
  }
}
