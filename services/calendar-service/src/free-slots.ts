export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface FreeSlot {
  start_at: string;
  end_at: string;
  duration_minutes: number;
}

export interface FreeSlotsParams {
  from: Date;
  to: Date;
  minDurationMinutes: number;
  workingHoursStart: number; // heure locale Europe/Paris, 0-23
  workingHoursEnd: number; // heure locale Europe/Paris, 0-23, exclusif
}

// Découpe [from, to) en fenêtres "heures d'éveil" journalières (working_hours_start
// à working_hours_end, en heure de Paris — pas UTC, sans quoi "pas après 22h" affiche
// minuit à l'utilisateur en été), puis soustrait les intervalles occupés (busy) pour
// trouver les trous.
export function computeFreeSlots(params: FreeSlotsParams, busy: BusyInterval[]): FreeSlot[] {
  const dayWindows = buildDayWindows(params.from, params.to, params.workingHoursStart, params.workingHoursEnd);
  const sortedBusy = [...busy].sort((a, b) => a.start.getTime() - b.start.getTime());

  const slots: FreeSlot[] = [];

  for (const window of dayWindows) {
    let cursor = window.start;

    const overlapping = sortedBusy.filter((b) => b.end > window.start && b.start < window.end);

    for (const b of overlapping) {
      if (b.start > cursor) {
        pushSlotIfLongEnough(slots, cursor, b.start, params.minDurationMinutes);
      }
      if (b.end > cursor) {
        cursor = b.end;
      }
    }

    if (cursor < window.end) {
      pushSlotIfLongEnough(slots, cursor, window.end, params.minDurationMinutes);
    }
  }

  return slots;
}

function pushSlotIfLongEnough(slots: FreeSlot[], start: Date, end: Date, minDurationMinutes: number): void {
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (durationMinutes < minDurationMinutes) return;

  slots.push({
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    duration_minutes: durationMinutes,
  });
}

const WORKING_TIMEZONE = 'Europe/Paris';

const parisDatePartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: WORKING_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Date civile (Y-M-D) telle qu'affichée à Paris pour un instant UTC donné.
function parisDateParts(instant: Date): { year: number; month: number; day: number } {
  const parts = parisDatePartsFormatter.formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

// Instant UTC correspondant à "année-mois-jour à hour:00" heure de Paris.
// Approche par correction d'écart : on part d'une estimation UTC naïve, on lit
// l'heure qu'elle affiche à Paris, puis on corrige la différence — gère
// automatiquement le passage CET/CEST sans dépendance externe.
function parisWallTimeToUtc(year: number, month: number, day: number, hour: number): Date {
  const naiveUtc = new Date(Date.UTC(year, month - 1, day, hour));
  const shownAtParis = new Intl.DateTimeFormat('en-US', {
    timeZone: WORKING_TIMEZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(naiveUtc);
  const get = (type: string) => Number(shownAtParis.find((p) => p.type === type)!.value);
  const shownAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') === 24 ? 0 : get('hour'), get('minute'));
  const diffMs = naiveUtc.getTime() - shownAsUtc;
  return new Date(naiveUtc.getTime() + diffMs);
}

function buildDayWindows(
  from: Date,
  to: Date,
  workingHoursStart: number,
  workingHoursEnd: number
): BusyInterval[] {
  const windows: BusyInterval[] = [];

  let { year, month, day } = parisDateParts(from);

  while (true) {
    const dayStart = parisWallTimeToUtc(year, month, day, workingHoursStart);
    const dayEnd = parisWallTimeToUtc(year, month, day, workingHoursEnd);

    if (dayStart >= to) break;

    const windowStart = dayStart < from ? from : dayStart;
    const windowEnd = dayEnd > to ? to : dayEnd;

    if (windowStart < windowEnd) {
      windows.push({ start: windowStart, end: windowEnd });
    }

    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
    year = nextDay.getUTCFullYear();
    month = nextDay.getUTCMonth() + 1;
    day = nextDay.getUTCDate();
  }

  return windows;
}
