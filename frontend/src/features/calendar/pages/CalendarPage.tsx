import { CalKelenda, type CalendarEvent } from '@kelenda/cal-kelenda'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useToast } from '../../../components/ui/toast-context'
import { updateEvent } from '../api/calendar-api'
import { CreateEventModal } from '../components/CreateEventModal'
import { EditEventModal } from '../components/EditEventModal'
import { ManageSourcesModal } from '../components/ManageSourcesModal'
import { useCalendarEvents } from '../use-calendar-events'

const DEFAULT_RANGE = (() => {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14)
  return { from, to }
})()

export function CalendarPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [range, setRange] = useState(DEFAULT_RANGE)
  const { events, isLoading, isError } = useCalendarEvents(range)
  const [createAt, setCreateAt] = useState<Date | null>(null)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [showSources, setShowSources] = useState(false)

  const handleRangeChange = useCallback((next: { from: Date; to: Date }) => {
    setRange(next)
  }, [])

  const moveMutation = useMutation({
    mutationFn: ({ id, start_at, end_at }: { id: string; start_at: string; end_at: string }) =>
      updateEvent(id, { start_at, end_at }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
      showToast("Impossible de déplacer l'événement.", 'error')
    },
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isError && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-sm text-red-600">
          Impossible de charger le calendrier pour le moment.
        </div>
      )}
      <div className="flex items-center justify-end border-b border-border px-6 py-2">
        <button
          type="button"
          onClick={() => setShowSources(true)}
          className="rounded-md px-3 py-1.5 text-sm text-ink/60 transition-colors hover:bg-cream hover:text-ink"
        >
          Mes calendriers
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <CalKelenda
          events={isLoading ? [] : events}
          onRangeChange={handleRangeChange}
          onCreateEvent={() => setCreateAt(new Date())}
          onSlotClick={(date) => setCreateAt(date)}
          onEventClick={(event) => setEditingEvent(event)}
          onEventMove={(event, newStartAt, newEndAt) =>
            moveMutation.mutate({ id: event.id, start_at: newStartAt, end_at: newEndAt })
          }
        />
      </div>

      {createAt && <CreateEventModal initialDate={createAt} onClose={() => setCreateAt(null)} />}
      {editingEvent && <EditEventModal event={editingEvent} onClose={() => setEditingEvent(null)} />}
      {showSources && <ManageSourcesModal onClose={() => setShowSources(false)} />}
    </div>
  )
}
