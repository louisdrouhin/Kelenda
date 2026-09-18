// Client API Légifrance (PISTE) — base KALI (conventions collectives).
// OAuth2 client-credentials (doc section 5 : "API Légifrance (portail PISTE) —
// accès à la base KALI, gratuite après inscription, mise à jour quotidienne").
//
// Comme pour l'API Entreprise, ne lève jamais : une indisponibilité de
// Légifrance ne doit jamais bloquer une vérification de prime, elle échoue
// juste silencieusement (le résultat sera "rien trouvé" plutôt qu'une 500).

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const oauthUrl = process.env.LEGIFRANCE_OAUTH_URL;
  const clientId = process.env.LEGIFRANCE_CLIENT_ID;
  const clientSecret = process.env.LEGIFRANCE_CLIENT_SECRET;

  if (!oauthUrl || !clientId || !clientSecret || clientId === 'CHANGE_ME') {
    console.warn('legifrance: identifiants OAuth non configurés');
    return null;
  }

  try {
    const response = await fetch(oauthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'openid',
      }),
    });

    if (!response.ok) {
      console.warn(`legifrance: échec d'authentification OAuth (${response.status})`);
      return null;
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    cachedToken = {
      value: data.access_token,
      // marge de 30s avant l'expiration réelle, pour ne jamais utiliser un token expiré de justesse
      expiresAt: Date.now() + (data.expires_in - 30) * 1000,
    };
    return cachedToken.value;
  } catch (err) {
    console.warn('legifrance: erreur réseau lors de l\'authentification OAuth', err);
    return null;
  }
}

export interface KaliConventionText {
  idcc: string;
  title: string;
}

// Recherche le texte de base d'une convention collective par code IDCC
// (base KALI). Retourne null si Légifrance n'est pas configuré, en échec, ou
// si aucun texte n'est trouvé pour ce code.
export async function fetchKaliConventionByIdcc(idccCode: string): Promise<KaliConventionText | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const baseUrl = process.env.LEGIFRANCE_API_BASE_URL;
  if (!baseUrl) return null;

  try {
    // Endpoint et forme du payload ({ id: idccCode }, pas { idcc: idccCode })
    // vérifiés par appel réel contre l'API PISTE le 2026-09-19 (non documenté
    // publiquement sans être authentifié sur le portail — confirmé via la
    // source de la librairie pylegifrance, elle-même dérivée du swagger réel).
    const response = await fetch(`${baseUrl}/consult/kaliContIdcc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: idccCode }),
    });

    if (!response.ok) {
      console.warn(`legifrance: échec de recherche IDCC ${idccCode} (${response.status})`);
      return null;
    }

    const data = (await response.json()) as { id?: string; titre?: string };
    if (!data.id) return null;

    return { idcc: idccCode, title: data.titre ?? `Convention IDCC ${idccCode}` };
  } catch (err) {
    console.warn(`legifrance: erreur réseau pour l'IDCC ${idccCode}`, err);
    return null;
  }
}

// Recherche plein-texte dans le texte de la convention (ex. "prime de vacances").
// Retourne les extraits pertinents trouvés, ou un tableau vide si rien.
export async function searchKaliConventionText(idccCode: string, query: string): Promise<string[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const baseUrl = process.env.LEGIFRANCE_API_BASE_URL;
  if (!baseUrl) return [];

  try {
    // Forme du payload et de la réponse vérifiées par appel réel contre
    // l'API PISTE le 2026-09-19 : le résultat de recherche imbrique le
    // titre dans results[].titles[0].title, pas results[].titre.
    const response = await fetch(`${baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recherche: {
          champs: [
            {
              typeChamp: 'ALL',
              criteres: [{ typeRecherche: 'UN_DES_MOTS', valeur: query, operateur: 'ET' }],
              operateur: 'ET',
            },
          ],
          filtres: [{ facette: 'IDCC', valeurs: [idccCode] }],
          pageSize: 10,
          pageNumber: 1,
          sort: 'PERTINENCE',
          typePagination: 'DEFAUT',
        },
        fond: 'KALI',
      }),
    });

    if (!response.ok) {
      console.warn(`legifrance: échec de recherche plein-texte IDCC ${idccCode} (${response.status})`);
      return [];
    }

    const data = (await response.json()) as {
      results?: Array<{ titles?: Array<{ title?: string }> }>;
    };
    return (data.results ?? [])
      .map((r) => r.titles?.[0]?.title ?? '')
      .filter(Boolean);
  } catch (err) {
    console.warn(`legifrance: erreur réseau lors de la recherche plein-texte IDCC ${idccCode}`, err);
    return [];
  }
}
