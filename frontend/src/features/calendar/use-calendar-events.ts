import type { CalendarEvent } from '@kelenda/cal-kelenda'
import { useQuery } from '@tanstack/react-query'
import { fetchEvents, type CalendarEventDto } from './api/calendar-api'

function toCalendarEvent(dto: CalendarEventDto): CalendarEvent {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    location: dto.location,
    startAt: dto.start_at,
    endAt: dto.end_at,
    allDay: dto.all_day,
    category: dto.category,
    isDeadline: dto.is_deadline,
    editable: dto.source_type === 'interne',
  }
}

export function useCalendarEvents(range: { from: Date; to: Date }) {
  const query = useQuery({
    queryKey: ['calendar', 'events', range.from.toISOString(), range.to.toISOString()],
    queryFn: () => fetchEvents(range),
  })

  return {
    ...query,
    events: query.data?.map(toCalendarEvent) ?? [],
  }
}
