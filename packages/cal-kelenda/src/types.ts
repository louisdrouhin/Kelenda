export type EventCategory = 'ecole' | 'entreprise' | 'personnel'

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  location?: string | null
  startAt: string
  endAt: string
  allDay: boolean
  category: EventCategory
  isDeadline?: boolean
  /**
   * Un événement issu d'un calendrier externe (ICS école/entreprise) est en
   * lecture seule côté Kelenda : le modifier serait écrasé au sync suivant.
   * Seuls les événements créés dans Kelenda (source "interne") sont éditables
   * et déplaçables (drag & drop).
   */
  editable: boolean
}

export type CalendarViewMode = 'day' | 'week' | 'month' | 'list'

export interface NewEventInput {
  title: string
  description?: string
  location?: string
  startAt: string
  endAt: string
  allDay: boolean
  category: EventCategory
}
