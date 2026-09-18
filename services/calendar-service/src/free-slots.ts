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
  workingHoursStart: number; // heure locale UTC, 0-23
  workingHoursEnd: number; // heure locale UTC, 0-23, exclusif
}

// Découpe [from, to) en fenêtres "heures d'éveil" journalières (working_hours_start
// à working_hours_end, en UTC), puis soustrait les intervalles occupés (busy) pour
// trouver les trous. Ne gère pas les fuseaux horaires utilisateur — tout en UTC.
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

function buildDayWindows(
  from: Date,
  to: Date,
  workingHoursStart: number,
  workingHoursEnd: number
): BusyInterval[] {
  const windows: BusyInterval[] = [];

  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));

  while (cursor < to) {
    const dayStart = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(), workingHoursStart)
    );
    const dayEnd = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(), workingHoursEnd)
    );

    const windowStart = dayStart < from ? from : dayStart;
    const windowEnd = dayEnd > to ? to : dayEnd;

    if (windowStart < windowEnd) {
      windows.push({ start: windowStart, end: windowEnd });
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return windows;
}
