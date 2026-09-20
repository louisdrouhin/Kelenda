import { categoryStyles } from './category-styles'
import { addDays, endOfMonth, formatDayNumber, isSameDay, startOfMonth, startOfWeek } from './date-utils'
import type { CalendarEvent } from './types'

const MAX_VISIBLE_EVENTS_PER_DAY = 3

interface MonthViewProps {
  monthAnchor: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDayClick?: (date: Date) => void
}

export function MonthView({ monthAnchor, events, onEventClick, onDayClick }: MonthViewProps) {
  const gridStart = startOfWeek(startOfMonth(monthAnchor))
  const monthEnd = endOfMonth(monthAnchor)
  const gridEnd = startOfWeek(monthEnd)
  const dayCount = Math.round((addDays(gridEnd, 7).getTime() - gridStart.getTime()) / 86_400_000)
  const days = Array.from({ length: dayCount }, (_, i) => addDays(gridStart, i))
  const weekdayLabels = days.slice(0, 7).map((d) => d.toLocaleDateString('fr-FR', { weekday: 'short' }))

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {weekdayLabels.map((label) => (
          <div key={label} className="border-l border-border py-2 text-center text-[11px] uppercase text-ink/45 first:border-l-0">
            {label}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 overflow-y-auto">
        {days.map((day) => {
          const inMonth = day.getMonth() === monthAnchor.getMonth()
          const dayEvents = events.filter((e) => isSameDay(new Date(e.startAt), day))
          const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS_PER_DAY)
          const overflow = dayEvents.length - visible.length

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              className={`flex flex-col items-start gap-1 border-l border-t border-border p-1.5 text-left first:border-l-0 ${
                inMonth ? '' : 'bg-cream/40'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isSameDay(day, new Date()) ? 'bg-ink text-white' : inMonth ? 'text-ink' : 'text-ink/35'
                }`}
              >
                {formatDayNumber(day)}
              </span>
              <div className="flex w-full flex-col gap-0.5">
                {visible.map((event) => (
                  <span
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                    className={`truncate rounded px-1 py-0.5 text-[10px] ${categoryStyles[event.category].bg} ${categoryStyles[event.category].text} ${categoryStyles[event.category].border}`}
                  >
                    {event.title}
                  </span>
                ))}
                {overflow > 0 && <span className="text-[10px] text-ink/45">+{overflow} de plus</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
