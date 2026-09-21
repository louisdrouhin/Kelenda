import { categoryStyles } from './category-styles'
import { formatTime } from './date-utils'
import type { CalendarEvent } from './types'

interface ListViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

export function ListView({ events, onEventClick }: ListViewProps) {
  const sorted = [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  const groups = new Map<string, CalendarEvent[]>()
  for (const event of sorted) {
    const key = new Date(event.startAt).toDateString()
    const group = groups.get(key)
    if (group) group.push(event)
    else groups.set(key, [event])
  }

  if (sorted.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-ink/50">Aucun événement sur cette période.</div>
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-4">
      {[...groups.entries()].map(([dayKey, dayEvents]) => (
        <div key={dayKey} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-ink">
            {new Date(dayKey).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <div className="flex flex-col gap-1.5">
            {dayEvents.map((event) => {
              const style = categoryStyles[event.category]
              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${style.bg} ${style.border}`}
                >
                  <span className="w-16 shrink-0 text-xs text-ink/60">
                    {event.allDay ? 'Journée' : formatTime(new Date(event.startAt))}
                  </span>
                  <span className={`truncate ${style.text}`}>{event.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
