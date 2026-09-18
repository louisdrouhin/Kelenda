import { parseStringPromise } from 'xml2js';

// Extrait <D:sync-token> d'un body sync-collection (RFC 6578 §3.2). Absent
// (ou vide) sur la toute première synchronisation d'un client — dans ce cas
// il faut renvoyer TOUT l'état courant, pas juste les changements récents.
export async function parseSyncToken(xmlBody: string): Promise<string | null> {
  if (!xmlBody || xmlBody.trim().length === 0) return null;

  let parsed;
  try {
    parsed = await parseStringPromise(xmlBody, { explicitArray: false, tagNameProcessors: [stripNamespace] });
  } catch {
    return null;
  }

  const token = findSyncToken(parsed);
  return typeof token === 'string' && token.trim().length > 0 ? token.trim() : null;
}

function stripNamespace(tag: string): string {
  const colonIndex = tag.indexOf(':');
  return colonIndex === -1 ? tag : tag.slice(colonIndex + 1);
}

function findSyncToken(node: unknown): unknown {
  if (!node || typeof node !== 'object') return undefined;

  const obj = node as Record<string, unknown>;
  if ('sync-token' in obj) return obj['sync-token'];

  for (const value of Object.values(obj)) {
    const found = findSyncToken(value);
    if (found !== undefined) return found;
  }

  return undefined;
}

// Format d'un sync-token : une URI opaque pour le client (RFC 6578 exige
// juste que ce soit une chaîne stable et comparable, pas un format précis).
// On encode le watermark (id max de caldav_sync_changes) dedans.
const SYNC_TOKEN_PREFIX = 'kelenda-sync:';

export function encodeSyncToken(watermark: number): string {
  return `${SYNC_TOKEN_PREFIX}${watermark}`;
}

export function decodeSyncToken(token: string | null): number {
  if (!token) return 0;
  if (!token.startsWith(SYNC_TOKEN_PREFIX)) return 0;
  const parsed = Number.parseInt(token.slice(SYNC_TOKEN_PREFIX.length), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}
