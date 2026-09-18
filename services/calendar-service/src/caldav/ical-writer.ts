export interface EventForIcs {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: Date | string;
  end_at: Date | string;
  all_day: boolean;
  caldav_etag: string;
}

// Format iCalendar (RFC 5545) — date UTC en base "YYYYMMDDTHHMMSSZ".
function formatIcsDate(date: Date | string, allDay: boolean): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');

  if (allDay) {
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  }

  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes()
  )}${pad(d.getUTCSeconds())}Z`;
}

// Échappe les caractères spéciaux du format iCalendar (RFC 5545 §3.3.11) —
// pas les mêmes règles que l'échappement XML ou JSON.
function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function eventToVevent(event: EventForIcs): string {
  const dtStamp = formatIcsDate(new Date(), false);
  const dtStart = formatIcsDate(event.start_at, event.all_day);
  const dtEnd = formatIcsDate(event.end_at, event.all_day);
  const dateParam = event.all_day ? ';VALUE=DATE' : '';

  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.id}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART${dateParam}:${dtStart}`,
    `DTEND${dateParam}:${dtEnd}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  }

  lines.push('END:VEVENT');

  return lines.join('\r\n');
}

export function eventToIcsDocument(event: EventForIcs): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kelenda//CalDAV Server//FR',
    eventToVevent(event),
    'END:VCALENDAR',
  ].join('\r\n');
}
