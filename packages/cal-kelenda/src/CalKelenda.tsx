import { useEffect, useMemo, useState } from 'react'
import { DayView } from './DayView'
import { formatMonthYear, formatWeekRangeLabel, startOfWeek } from './date-utils'
import { ListView } from './ListView'
import { MonthView } from './MonthView'
import { rangeForView, shiftAnchor } from './nav-utils'
import type { CalendarEvent, CalendarViewMode } from './types'
import { WeekView } from './WeekView'

const viewLabels: Record<CalendarViewMode, string> = {
  day: 'Jour',
  week: 'Semaine',
  month: 'Mois',
  list: 'Liste',
}

interface CalKelendaProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onSlotClick?: (date: Date) => void
  onCreateEvent?: () => void
  /** Appelé quand un événement éditable est déplacé (drag & drop) vers un nouveau créneau. */
  onEventMove?: (event: CalendarEvent, newStartAt: string, newEndAt: string) => void
  initialView?: CalendarViewMode
  /**
   * Appelé à chaque changement de vue/période affichée, pour que le parent recharge
   * les événements de la bonne plage. Doit être stable (useCallback) pour éviter un
   * re-déclenchement à chaque render du parent.
   */
  onRangeChange?: (range: { from: Date; to: Date }) => void
}

export function CalKelenda({
  events,
  onEventClick,
  onSlotClick,
  onCreateEvent,
  onEventMove,
  initialView = 'week',
  onRangeChange,
}: CalKelendaProps) {
  const [view, setView] = useState<CalendarViewMode>(initialView)
  const [anchor, setAnchor] = useState(() => new Date())

  const headerLabel = useMemo(() => {
    if (view === 'month') return formatMonthYear(anchor)
    if (view === 'day') return anchor.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    return formatWeekRangeLabel(startOfWeek(anchor))
  }, [anchor, view])

  useEffect(() => {
    onRangeChange?.(rangeForView(anchor, view))
  }, [anchor, view, onRangeChange])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:bg-cream"
          >
            Aujourd'hui
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Période précédente"
              onClick={() => setAnchor((a) => shiftAnchor(a, view, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink/60 transition-colors hover:bg-cream hover:text-ink"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Période suivante"
              onClick={() => setAnchor((a) => shiftAnchor(a, view, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink/60 transition-colors hover:bg-cream hover:text-ink"
            >
              ›
            </button>
          </div>
          <h2 className="text-lg text-ink">{headerLabel}</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-border p-0.5">
            {(Object.keys(viewLabels) as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded px-3 py-1 text-sm transition-colors ${
                  view === mode ? 'bg-ink text-white' : 'text-ink/60 hover:text-ink'
                }`}
              >
                {viewLabels[mode]}
              </button>
            ))}
          </div>
          {onCreateEvent && (
            <button
              type="button"
              onClick={onCreateEvent}
              className="rounded-md bg-ink px-4 py-1.5 text-sm text-white transition-colors hover:bg-ink/85"
            >
              + Événement
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'day' && (
          <DayView day={anchor} events={events} onEventClick={onEventClick} onSlotClick={onSlotClick} onEventMove={onEventMove} />
        )}
        {view === 'week' && (
          <WeekView
            weekStart={startOfWeek(anchor)}
            events={events}
            onEventClick={onEventClick}
            onSlotClick={onSlotClick}
            onEventMove={onEventMove}
          />
        )}
        {view === 'month' && <MonthView monthAnchor={anchor} events={events} onEventClick={onEventClick} onDayClick={onSlotClick} />}
        {view === 'list' && <ListView events={events} onEventClick={onEventClick} />}
      </div>
    </div>
  )
}
