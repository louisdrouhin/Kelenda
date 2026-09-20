import type { EventCategory } from '@kelenda/cal-kelenda'
import { http } from '../../../lib/http'

const CALENDAR_BASE_URL = import.meta.env.VITE_CALENDAR_API_URL ?? '/calendar'

export type SourceType = 'ics_ecole' | 'ics_entreprise' | 'caldav_perso' | 'interne'

export interface CalendarEventDto {
  id: string
  source_id: string
  source_type: SourceType
  title: string
  description: string | null
  location: string | null
  start_at: string
  end_at: string
  all_day: boolean
  category: EventCategory
  is_deadline: boolean
  created_at: string
  updated_at: string
}

export interface CreateEventPayload {
  title: string
  description?: string
  location?: string
  start_at: string
  end_at: string
  all_day: boolean
  category: EventCategory
}

export interface UpdateEventPayload {
  title?: string
  description?: string
  location?: string
  start_at?: string
  end_at?: string
  all_day?: boolean
  category?: EventCategory
}

export async function fetchEvents(range: { from: Date; to: Date; category?: EventCategory }): Promise<CalendarEventDto[]> {
  const { data } = await http.get<CalendarEventDto[]>(`${CALENDAR_BASE_URL}/events`, {
    params: { from: range.from.toISOString(), to: range.to.toISOString(), category: range.category },
  })
  return data
}

export async function createEvent(payload: CreateEventPayload): Promise<CalendarEventDto> {
  const { data } = await http.post<CalendarEventDto>(`${CALENDAR_BASE_URL}/events`, payload)
  return data
}

export async function updateEvent(id: string, payload: UpdateEventPayload): Promise<CalendarEventDto> {
  const { data } = await http.patch<CalendarEventDto>(`${CALENDAR_BASE_URL}/events/${id}`, payload)
  return data
}

export async function deleteEvent(id: string): Promise<void> {
  await http.delete(`${CALENDAR_BASE_URL}/events/${id}`)
}

export interface CalendarSourceDto {
  id: string
  type: SourceType
  label: string | null
  url: string | null
  last_synced_at: string | null
  sync_status: 'pending' | 'ok' | 'error'
  created_at: string
}

export async function fetchSources(): Promise<CalendarSourceDto[]> {
  const { data } = await http.get<CalendarSourceDto[]>(`${CALENDAR_BASE_URL}/sources`)
  return data
}

export async function createSource(payload: {
  type: 'ics_ecole' | 'ics_entreprise'
  label?: string
  url: string
}): Promise<CalendarSourceDto> {
  const { data } = await http.post<CalendarSourceDto>(`${CALENDAR_BASE_URL}/sources`, payload)
  return data
}

export async function syncSource(id: string): Promise<{ synced_events: number; new_conflicts: number }> {
  const { data } = await http.post(`${CALENDAR_BASE_URL}/sources/${id}/sync`)
  return data
}

export async function deleteSource(id: string): Promise<void> {
  await http.delete(`${CALENDAR_BASE_URL}/sources/${id}`)
}
