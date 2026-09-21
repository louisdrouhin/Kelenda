import type { EventCategory } from './types'

export const categoryStyles: Record<EventCategory, { bg: string; border: string; text: string; label: string }> = {
  ecole: { bg: 'bg-blue-50', border: 'border-l-[3px] border-l-[#008CFF]', text: 'text-[#08070C]', label: 'École' },
  entreprise: { bg: 'bg-amber-50', border: 'border-l-[3px] border-l-amber-500', text: 'text-[#08070C]', label: 'Entreprise' },
  personnel: { bg: 'bg-emerald-50', border: 'border-l-[3px] border-l-emerald-500', text: 'text-[#08070C]', label: 'Personnel' },
}
