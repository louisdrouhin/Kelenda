import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/toast-context'
import { toLocalInputValue } from '../../calendar/event-form-utils'
import { acceptFreeSlot, type FreeSlot } from '../api/free-slots-api'

interface AcceptSlotModalProps {
  slot: FreeSlot
  onClose: () => void
}

export function AcceptSlotModal({ slot, onClose }: AcceptSlotModalProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [start, setStart] = useState(toLocalInputValue(new Date(slot.start_at)))
  const [end, setEnd] = useState(toLocalInputValue(new Date(slot.end_at)))
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: acceptFreeSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'free-slots'] })
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
      showToast('Créneau de révision ajouté à ton calendrier.')
      onClose()
    },
    onError: () => setError('Impossible de réserver ce créneau.'),
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
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
    })
  }

  return (
    <Modal title="Réserver ce créneau" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Que veux-tu réviser ?"
          name="title"
          placeholder="Ex : Révision Maths"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

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

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Réservation…' : 'Réserver'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
