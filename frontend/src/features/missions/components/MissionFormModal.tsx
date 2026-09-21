import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/toast-context'
import {
  createMission,
  deleteMission,
  updateMission,
  type MissionDto,
  type MissionStatus,
} from '../api/missions-api'

const statusLabels: Record<MissionStatus, string> = {
  in_progress: 'En cours',
  done: 'Terminée',
  cancelled: 'Annulée',
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10)
}

interface MissionFormModalProps {
  mission?: MissionDto
  onClose: () => void
}

export function MissionFormModal({ mission, onClose }: MissionFormModalProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const isEditing = !!mission

  const [title, setTitle] = useState(mission?.title ?? '')
  const [description, setDescription] = useState(mission?.description ?? '')
  const [startDate, setStartDate] = useState(mission ? toDateInputValue(mission.start_date) : toDateInputValue(new Date().toISOString()))
  const [endDate, setEndDate] = useState(mission?.end_date ? toDateInputValue(mission.end_date) : '')
  const [status, setStatus] = useState<MissionStatus>(mission?.status ?? 'in_progress')
  const [error, setError] = useState<string | null>(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['tracking', 'missions'] })
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      isEditing
        ? updateMission(mission.id, {
            title,
            description: description || undefined,
            start_date: startDate,
            end_date: endDate || null,
            status,
          })
        : createMission({
            title,
            description: description || undefined,
            start_date: startDate,
            end_date: endDate || undefined,
          }),
    onSuccess: () => {
      invalidate()
      showToast(isEditing ? 'Mission modifiée.' : 'Mission créée.')
      onClose()
    },
    onError: () => setError('Impossible d\'enregistrer la mission.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteMission(mission!.id),
    onSuccess: () => {
      invalidate()
      showToast('Mission supprimée.')
      onClose()
    },
    onError: () => setError('Impossible de supprimer la mission.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (endDate && startDate > endDate) {
      setError('La date de fin doit être après la date de début.')
      return
    }

    saveMutation.mutate()
  }

  return (
    <Modal title={isEditing ? 'Modifier la mission' : 'Nouvelle mission'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Titre" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm text-ink">
            Description (optionnel)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-md border border-border px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Début"
            type="date"
            name="start_date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="Fin (optionnel)"
            type="date"
            name="end_date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {isEditing && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-sm text-ink">
              Statut
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as MissionStatus)}
              className="rounded-md border border-border px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
            >
              {(Object.keys(statusLabels) as MissionStatus[]).map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="mt-2 flex items-center justify-between gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="rounded-md px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-50"
            >
              {deleteMutation.isPending ? 'Suppression…' : 'Supprimer'}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Enregistrement…' : isEditing ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
