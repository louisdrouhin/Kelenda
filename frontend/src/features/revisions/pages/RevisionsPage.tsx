import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { fetchEvents } from '../../calendar/api/calendar-api'
import { fetchFreeSlots, type FreeSlot } from '../api/free-slots-api'
import { AcceptSlotModal } from '../components/AcceptSlotModal'

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 h', value: 60 },
  { label: '1 h 30', value: 90 },
  { label: '2 h', value: 120 },
]

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h)

function rangeForNextDays(days: number): { from: Date; to: Date } {
  const from = new Date()
  const to = new Date()
  to.setDate(to.getDate() + days)
  return { from, to }
}

function formatSlotTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDurationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m}`
}

export function RevisionsPage() {
  const [minDuration, setMinDuration] = useState(60)
  const [workingHoursStart, setWorkingHoursStart] = useState(8)
  const [workingHoursEnd, setWorkingHoursEnd] = useState(22)
  const [selectedSlot, setSelectedSlot] = useState<FreeSlot | null>(null)

  const range = useMemo(() => rangeForNextDays(14), [])

  const { data: slots = [], isLoading, isError } = useQuery({
    queryKey: [
      'calendar',
      'free-slots',
      range.from.toISOString(),
      range.to.toISOString(),
      minDuration,
      workingHoursStart,
      workingHoursEnd,
    ],
    queryFn: () =>
      fetchFreeSlots({
        from: range.from,
        to: range.to,
        minDurationMinutes: minDuration,
        workingHoursStart,
        workingHoursEnd,
      }),
  })

  // Le backend exclut volontairement les événements 'personnel' du calcul des
  // créneaux libres (on peut superposer une révision à une autre) — on les
  // affiche donc à part pour que l'utilisateur voie ce qu'il a déjà programmé.
  const { data: plannedRevisions = [] } = useQuery({
    queryKey: ['calendar', 'events', 'personnel', range.from.toISOString(), range.to.toISOString()],
    queryFn: () => fetchEvents({ from: range.from, to: range.to, category: 'personnel' }),
  })

  const groups = useMemo(() => {
    const map = new Map<string, FreeSlot[]>()
    for (const slot of slots) {
      const key = new Date(slot.start_at).toDateString()
      const group = map.get(key)
      if (group) group.push(slot)
      else map.set(key, [slot])
    }
    return [...map.entries()]
  }, [slots])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-1 px-10 pt-10">
        <h1 className="text-2xl text-ink">Suggestions de révision</h1>
        <p className="text-sm text-ink/60">
          Créneaux libres entre tes cours et missions, sur les 14 prochains jours.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-6 border-b border-border px-10 py-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="min-duration" className="text-xs text-ink/50">
            Durée minimum
          </label>
          <select
            id="min-duration"
            value={minDuration}
            onChange={(e) => setMinDuration(Number(e.target.value))}
            className="rounded-md border border-border px-3 py-2 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="hours-start" className="text-xs text-ink/50">
            Pas avant
          </label>
          <select
            id="hours-start"
            value={workingHoursStart}
            onChange={(e) => setWorkingHoursStart(Number(e.target.value))}
            className="rounded-md border border-border px-3 py-2 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h} disabled={h >= workingHoursEnd}>
                {h.toString().padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="hours-end" className="text-xs text-ink/50">
            Pas après
          </label>
          <select
            id="hours-end"
            value={workingHoursEnd}
            onChange={(e) => setWorkingHoursEnd(Number(e.target.value))}
            className="rounded-md border border-border px-3 py-2 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h + 1} disabled={h + 1 <= workingHoursStart}>
                {(h + 1).toString().padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </div>
      </div>

      {plannedRevisions.length > 0 && (
        <div className="flex flex-col gap-2 border-b border-border px-10 py-5">
          <h2 className="text-sm font-medium text-ink">Déjà programmé</h2>
          <div className="flex flex-wrap gap-2">
            {plannedRevisions.map((event) => (
              <div
                key={event.id}
                className="flex flex-col items-start gap-0.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5"
              >
                <span className="text-sm text-ink">{event.title}</span>
                <span className="text-xs text-ink/50">
                  {new Date(event.start_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}
                  {formatSlotTime(new Date(event.start_at))} – {formatSlotTime(new Date(event.end_at))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 px-10 py-6">
        {isError && <p className="text-sm text-red-500">Impossible de charger les créneaux libres.</p>}
        {isLoading && <p className="text-sm text-ink/50">Recherche des créneaux…</p>}
        {!isLoading && !isError && groups.length === 0 && (
          <p className="text-sm text-ink/50">Aucun créneau libre ne correspond à ces critères sur les 14 prochains jours.</p>
        )}

        {groups.map(([dayKey, daySlots]) => (
          <div key={dayKey} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-ink">
              {new Date(dayKey).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((slot) => (
                <button
                  key={slot.start_at}
                  onClick={() => setSelectedSlot(slot)}
                  className="flex flex-col items-start gap-0.5 rounded-lg border border-border px-4 py-2.5 text-left transition-colors hover:border-ink/30 hover:bg-cream"
                >
                  <span className="text-sm text-ink">
                    {formatSlotTime(new Date(slot.start_at))} – {formatSlotTime(new Date(slot.end_at))}
                  </span>
                  <span className="text-xs text-ink/50">{formatDurationLabel(slot.duration_minutes)} disponible</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedSlot && <AcceptSlotModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} />}
    </div>
  )
}
