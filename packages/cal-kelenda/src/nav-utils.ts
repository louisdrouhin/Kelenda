import { addDays, startOfDay, startOfWeek } from './date-utils'
import type { CalendarViewMode } from './types'

export function shiftAnchor(anchor: Date, view: CalendarViewMode, direction: 1 | -1): Date {
  switch (view) {
    case 'day':
      return addDays(anchor, direction)
    case 'week':
    case 'list':
      return addDays(anchor, 7 * direction)
    case 'month': {
      const d = new Date(anchor)
      d.setMonth(d.getMonth() + direction)
      return d
    }
  }
}

export function rangeForView(anchor: Date, view: CalendarViewMode): { from: Date; to: Date } {
  switch (view) {
    case 'day': {
      const dayStart = startOfDay(anchor)
      return { from: dayStart, to: addDays(dayStart, 1) }
    }
    case 'week':
    case 'list': {
      const weekStart = startOfWeek(anchor)
      return { from: weekStart, to: addDays(weekStart, 7) }
    }
    case 'month': {
      const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
      const gridStart = startOfWeek(monthStart)
      return { from: gridStart, to: addDays(gridStart, 42) }
    }
  }
}
