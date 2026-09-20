import { WeekView } from './WeekView'
import type { CalendarEvent } from './types'

interface DayViewProps {
  day: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onSlotClick?: (date: Date) => void
  onEventMove?: (event: CalendarEvent, newStartAt: string, newEndAt: string) => void
}

// Réutilise la grille horaire de WeekView sur une seule colonne plutôt que
// de dupliquer le calcul de positionnement des événements chevauchants.
export function DayView({ day, events, onEventClick, onSlotClick, onEventMove }: DayViewProps) {
  return (
    <WeekView
      weekStart={day}
      events={events}
      onEventClick={onEventClick}
      onSlotClick={onSlotClick}
      onEventMove={onEventMove}
      daysToShow={1}
    />
  )
}
