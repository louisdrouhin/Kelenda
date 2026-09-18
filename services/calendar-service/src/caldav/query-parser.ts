import { parseStringPromise } from 'xml2js';

export interface CalendarQueryTimeRange {
  start?: Date;
  end?: Date;
}

// RFC 5545 §3.3.4 : "20260921T090000Z" (UTC) ou "20260921T090000" (local, rare
// côté time-range CalDAV — on ne gère que le format UTC, très largement
// dominant chez les vrais clients).
function parseIcsTimestamp(value: string): Date {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!match) {
    throw new Error(`Format de date CalDAV non reconnu : ${value}`);
  }
  const [, year, month, day, hour, minute, second] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
}

// Extrait <C:time-range start="..." end="..."/> d'un body calendar-query
// (RFC 4791 §7.8.6 — imbriqué sous filter/comp-filter/comp-filter/time-range).
// Body absent, mal formé, ou sans filtre temporel → aucune borne (tout renvoyer).
export async function parseCalendarQueryTimeRange(xmlBody: string): Promise<CalendarQueryTimeRange> {
  if (!xmlBody || xmlBody.trim().length === 0) return {};

  let parsed;
  try {
    parsed = await parseStringPromise(xmlBody, { explicitArray: false, tagNameProcessors: [stripNamespace] });
  } catch {
    return {};
  }

  const timeRange = findTimeRangeNode(parsed);
  if (!timeRange || typeof timeRange !== 'object') return {};

  const attrs = (timeRange as { $?: Record<string, string> }).$ ?? {};
  const result: CalendarQueryTimeRange = {};

  if (attrs.start) {
    try {
      result.start = parseIcsTimestamp(attrs.start);
    } catch {
      // ignore une borne mal formée plutôt que de faire échouer toute la requête
    }
  }
  if (attrs.end) {
    try {
      result.end = parseIcsTimestamp(attrs.end);
    } catch {
      // idem
    }
  }

  return result;
}

function stripNamespace(tag: string): string {
  const colonIndex = tag.indexOf(':');
  return colonIndex === -1 ? tag : tag.slice(colonIndex + 1);
}

function findTimeRangeNode(node: unknown): unknown {
  if (!node || typeof node !== 'object') return undefined;

  const obj = node as Record<string, unknown>;
  if ('time-range' in obj) return obj['time-range'];

  for (const value of Object.values(obj)) {
    const found = findTimeRangeNode(value);
    if (found) return found;
  }

  return undefined;
}
