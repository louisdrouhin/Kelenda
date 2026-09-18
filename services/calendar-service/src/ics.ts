import ical from 'node-ical';

export interface ParsedIcsEvent {
  externalUid: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  raw: unknown;
}

export async function fetchAndParseIcs(url: string): Promise<ParsedIcsEvent[]> {
  const parsed = await ical.async.fromURL(url);

  const events: ParsedIcsEvent[] = [];
  for (const key of Object.keys(parsed)) {
    const item = parsed[key];
    if (item.type !== 'VEVENT') continue;
    if (!item.start || !item.end) continue;

    events.push({
      externalUid: item.uid ?? key,
      title: item.summary ?? 'Sans titre',
      description: item.description ?? null,
      location: item.location ?? null,
      startAt: new Date(item.start),
      endAt: new Date(item.end),
      allDay: Boolean((item.start as { dateOnly?: boolean }).dateOnly),
      raw: item,
    });
  }

  return events;
}

export type SourceTypeToCategory = 'ics_ecole' | 'ics_entreprise' | 'caldav_perso';

export function categoryForSourceType(type: SourceTypeToCategory): 'ecole' | 'entreprise' | 'personnel' {
  switch (type) {
    case 'ics_ecole':
      return 'ecole';
    case 'ics_entreprise':
      return 'entreprise';
    case 'caldav_perso':
      return 'personnel';
  }
}
