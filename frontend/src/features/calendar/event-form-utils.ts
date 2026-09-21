import type { EventCategory } from '@kelenda/cal-kelenda'

export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const categoryLabels: Record<EventCategory, string> = {
  ecole: 'École',
  entreprise: 'Entreprise',
  personnel: 'Personnel',
}
