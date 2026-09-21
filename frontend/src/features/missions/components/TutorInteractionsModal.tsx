import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/toast-context'
import { toLocalInputValue } from '../../calendar/event-form-utils'
import { fetchMissions } from '../api/missions-api'
import {
  createTutorInteraction,
  fetchTutorInteractions,
  type InteractionType,
  type TutorDto,
} from '../api/tutors-api'

const interactionLabels: Record<InteractionType, string> = {
  visite: 'Visite',
  bilan: 'Bilan',
  echange: 'Échange',
}

interface TutorInteractionsModalProps {
  tutor: TutorDto
  onClose: () => void
}

export function TutorInteractionsModal({ tutor, onClose }: TutorInteractionsModalProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [datetime, setDatetime] = useState(toLocalInputValue(new Date()))
  const [type, setType] = useState<InteractionType>('echange')
  const [notes, setNotes] = useState('')
  const [missionId, setMissionId] = useState('')

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['tracking', 'tutors', tutor.id, 'interactions'],
    queryFn: () => fetchTutorInteractions(tutor.id),
  })

  const { data: missions = [] } = useQuery({
    queryKey: ['tracking', 'missions', 'all'],
    queryFn: () => fetchMissions(),
  })

  const mutation = useMutation({
    mutationFn: () =>
      createTutorInteraction(tutor.id, {
        interaction_date: new Date(datetime).toISOString(),
        type,
        notes: notes || undefined,
        mission_id: missionId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking', 'tutors', tutor.id, 'interactions'] })
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
      showToast('Interaction ajoutée — visible aussi dans ton calendrier.')
      setNotes('')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <Modal title={`Suivi — ${tutor.name}`} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {isLoading && <p className="text-sm text-ink/50">Chargement…</p>}
          {!isLoading && interactions.length === 0 && (
            <p className="text-sm text-ink/50">Aucune interaction enregistrée pour l'instant.</p>
          )}
          {interactions.map((interaction) => (
            <div key={interaction.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{interactionLabels[interaction.type]}</span>
                <span className="text-xs text-ink/50">
                  {new Date(interaction.interaction_date).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {interaction.mission_title && (
                <p className="mt-1 text-xs text-ink/50">Mission : {interaction.mission_title}</p>
              )}
              {interaction.notes && <p className="mt-1 text-sm text-ink/70">{interaction.notes}</p>}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-border pt-4">
          <h3 className="text-sm font-medium text-ink">Ajouter une interaction</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="interaction-date" className="text-sm text-ink">
                Date et heure
              </label>
              <input
                id="interaction-date"
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                required
                className="rounded-md border border-border px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="interaction-type" className="text-sm text-ink">
                Type
              </label>
              <select
                id="interaction-type"
                value={type}
                onChange={(e) => setType(e.target.value as InteractionType)}
                className="rounded-md border border-border px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
              >
                {(Object.keys(interactionLabels) as InteractionType[]).map((t) => (
                  <option key={t} value={t}>
                    {interactionLabels[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="interaction-mission" className="text-sm text-ink">
              Mission concernée (optionnel)
            </label>
            <select
              id="interaction-mission"
              value={missionId}
              onChange={(e) => setMissionId(e.target.value)}
              className="rounded-md border border-border px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
            >
              <option value="">Aucune</option>
              {missions.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="interaction-notes" className="text-sm text-ink">
              Notes (optionnel)
            </label>
            <textarea
              id="interaction-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="rounded-md border border-border px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
            />
          </div>

          <p className="text-xs text-ink/40">Un événement d'1h sera aussi ajouté à ton calendrier.</p>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Fermer
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Ajout…' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
