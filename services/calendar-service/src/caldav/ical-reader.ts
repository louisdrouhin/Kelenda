export interface ParsedVevent {
  uid: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
}

// Parseur iCalendar (RFC 5545) minimal — un seul VEVENT par document, ce qui
// couvre l'usage réel des clients CalDAV en écriture (un PUT correspond à un
// seul événement modifié). Pas un parseur RFC 5545 généraliste (pas de
// RRULE/VALARM/VTIMEZONE — hors périmètre pour ce MVP, voir suivi d'implémentation).
export function parseVeventDocument(icsText: string): ParsedVevent {
  const unfolded = unfoldIcsLines(icsText);
  const lines = unfolded.split(/\r\n|\n/).filter((l) => l.length > 0);

  const veventStart = lines.findIndex((l) => l.trim() === 'BEGIN:VEVENT');
  const veventEnd = lines.findIndex((l) => l.trim() === 'END:VEVENT');
  if (veventStart === -1 || veventEnd === -1) {
    throw new Error('Aucun VEVENT trouvé dans le document iCalendar');
  }

  const fields: Record<string, { params: string[]; value: string }> = {};
  for (const line of lines.slice(veventStart + 1, veventEnd)) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const rawKey = line.slice(0, colonIndex);
    const value = line.slice(colonIndex + 1);
    const [name, ...params] = rawKey.split(';');

    fields[name.toUpperCase()] = { params, value };
  }

  const summary = fields.SUMMARY?.value;
  const dtstart = fields.DTSTART;
  const dtend = fields.DTEND;

  if (!summary) throw new Error('SUMMARY manquant');
  if (!dtstart) throw new Error('DTSTART manquant');
  if (!dtend) throw new Error('DTEND manquant');

  const allDay = dtstart.params.some((p) => p.toUpperCase() === 'VALUE=DATE');

  return {
    uid: fields.UID?.value ?? null,
    title: unescapeIcsText(summary),
    description: fields.DESCRIPTION ? unescapeIcsText(fields.DESCRIPTION.value) : null,
    location: fields.LOCATION ? unescapeIcsText(fields.LOCATION.value) : null,
    startAt: parseIcsDateValue(dtstart.value, allDay),
    endAt: parseIcsDateValue(dtend.value, allDay),
    allDay,
  };
}

// RFC 5545 §3.1 : les lignes longues sont repliées avec un CRLF suivi d'un
// espace/tab — il faut les "déplier" avant de découper ligne par ligne.
function unfoldIcsLines(text: string): string {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

function unescapeIcsText(value: string): string {
  return value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function parseIcsDateValue(value: string, allDay: boolean): Date {
  if (allDay) {
    const match = value.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!match) throw new Error(`Date VALUE=DATE invalide : ${value}`);
    const [, year, month, day] = match;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!match) throw new Error(`Date-heure invalide : ${value}`);
  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
  );
}
