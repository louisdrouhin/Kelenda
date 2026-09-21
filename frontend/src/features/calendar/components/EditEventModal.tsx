import type { CalendarEvent, EventCategory } from '@kelenda/cal-kelenda'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/toast-context'
import { deleteEvent, updateEvent } from '../api/calendar-api'
import { categoryLabels, toLocalInputValue } from '../event-form-utils'

interface EditEventModalProps {
  event: CalendarEvent
  onClose: () => void
}

export function EditEventModal({ event, onClose }: EditEventModalProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [title, setTitle] = useState(event.title)
  const [location, setLocation] = useState(event.location ?? '')
  const [category, setCategory] = useState<EventCategory>(event.category)
  const [start, setStart] = useState(toLocalInputValue(new Date(event.startAt)))
  const [end, setEnd] = useState(toLocalInputValue(new Date(event.endAt)))
  const [error, setError] = useState<string | null>(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
  }

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateEvent>[1]) => updateEvent(event.id, payload),
    onSuccess: () => {
      invalidate()
      showToast('Événement modifié.')
      onClose()
    },
    onError: () => setError("Impossible de modifier l'événement."),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(event.id),
    onSuccess: () => {
      invalidate()
      showToast('Événement supprimé.')
      onClose()
    },
    onError: () => setError("Impossible de supprimer l'événement."),
  })

  if (!event.editable) {
    return (
      <Modal title={event.title} onClose={onClose}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink/60">
            Cet événement provient d'un calendrier synchronisé (ICS) — il n'est pas modifiable depuis Kelenda.
          </p>
          {event.location && <p className="text-sm text-ink">{event.location}</p>}
          <p className="text-sm text-ink/70">
            {new Date(event.startAt).toLocaleString('fr-FR')} — {new Date(event.endAt).toLocaleString('fr-FR')}
          </p>
          <div className="mt-2 flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const startDate = new Date(start)
    const endDate = new Date(end)
    if (startDate >= endDate) {
      setError('La date de fin doit être après la date de début.')
      return
    }

    updateMutation.mutate({
      title,
      location: location || undefined,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      category,
    })
  }

  return (
    <Modal title="Modifier l'événement" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Titre" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Début"
            type="datetime-local"
            name="start"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
          <Input label="Fin" type="datetime-local" name="end" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </div>

        <Input label="Lieu (optionnel)" name="location" value={location} onChange={(e) => setLocation(e.target.value)} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm text-ink">
            Catégorie
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
            className="rounded-md border border-border px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
          >
            {(Object.keys(categoryLabels) as EventCategory[]).map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="rounded-md px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-50"
          >
            {deleteMutation.isPending ? 'Suppression…' : 'Supprimer'}
          </button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
