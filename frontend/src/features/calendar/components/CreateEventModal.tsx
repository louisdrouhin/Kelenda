import type { EventCategory } from '@kelenda/cal-kelenda'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/toast-context'
import { createEvent } from '../api/calendar-api'
import { categoryLabels, toLocalInputValue } from '../event-form-utils'

interface CreateEventModalProps {
  initialDate: Date
  onClose: () => void
}

export function CreateEventModal({ initialDate, onClose }: CreateEventModalProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const initialEnd = new Date(initialDate)
  initialEnd.setHours(initialEnd.getHours() + 1)

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState<EventCategory>('personnel')
  const [start, setStart] = useState(toLocalInputValue(initialDate))
  const [end, setEnd] = useState(toLocalInputValue(initialEnd))
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
      showToast('Événement créé.')
      onClose()
    },
    onError: () => setError("Impossible de créer l'événement."),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const startDate = new Date(start)
    const endDate = new Date(end)
    if (startDate >= endDate) {
      setError('La date de fin doit être après la date de début.')
      return
    }

    mutation.mutate({
      title,
      location: location || undefined,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      all_day: false,
      category,
    })
  }

  return (
    <Modal title="Nouvel événement" onClose={onClose}>
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

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Création…' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
