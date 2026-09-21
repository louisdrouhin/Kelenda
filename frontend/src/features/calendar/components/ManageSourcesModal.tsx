import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/toast-context'
import {
  createSource,
  deleteSource,
  fetchSources,
  syncSource,
  type CalendarSourceDto,
} from '../api/calendar-api'

const sourceTypeLabels: Record<CalendarSourceDto['type'], string> = {
  ics_ecole: 'École (ICS)',
  ics_entreprise: 'Entreprise (ICS)',
  caldav_perso: 'Personnel (CalDAV)',
  interne: 'Kelenda (interne)',
}

const syncStatusLabels: Record<CalendarSourceDto['sync_status'], string> = {
  pending: 'En attente de synchro',
  ok: 'Synchronisé',
  error: 'Erreur de synchro',
}

interface ManageSourcesModalProps {
  onClose: () => void
}

export function ManageSourcesModal({ onClose }: ManageSourcesModalProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { data: sources = [], isLoading } = useQuery({ queryKey: ['calendar', 'sources'], queryFn: fetchSources })

  const [newType, setNewType] = useState<'ics_ecole' | 'ics_entreprise'>('ics_ecole')
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  function invalidateSources() {
    queryClient.invalidateQueries({ queryKey: ['calendar', 'sources'] })
  }

  const createMutation = useMutation({
    mutationFn: createSource,
    onSuccess: () => {
      invalidateSources()
      setNewLabel('')
      setNewUrl('')
      showToast('Calendrier ajouté.')
    },
    onError: () => setError("Impossible d'ajouter ce calendrier. Vérifie l'URL."),
  })

  const syncMutation = useMutation({
    mutationFn: syncSource,
    onSuccess: (result) => {
      invalidateSources()
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
      showToast(`${result.synced_events} événement(s) synchronisé(s).`)
    },
    onError: () => showToast('Échec de la synchronisation.', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSource,
    onSuccess: () => {
      invalidateSources()
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] })
      showToast('Calendrier supprimé.')
    },
  })

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    createMutation.mutate({ type: newType, label: newLabel || undefined, url: newUrl })
  }

  const manageableSources = sources.filter((s) => s.type !== 'interne')

  return (
    <Modal title="Mes calendriers" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          {isLoading && <p className="text-sm text-ink/50">Chargement…</p>}
          {!isLoading && manageableSources.length === 0 && (
            <p className="text-sm text-ink/50">Aucun calendrier externe ajouté pour le moment.</p>
          )}
          {manageableSources.map((source) => (
            <div key={source.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm text-ink">{source.label || sourceTypeLabels[source.type]}</span>
                <span className="text-xs text-ink/50">
                  {sourceTypeLabels[source.type]} · {syncStatusLabels[source.sync_status]}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => syncMutation.mutate(source.id)}
                  disabled={syncMutation.isPending}
                  className="rounded-md px-2.5 py-1.5 text-xs text-ink/70 hover:bg-cream hover:text-ink"
                >
                  Synchroniser
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(source.id)}
                  className="rounded-md px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="flex flex-col gap-3 border-t border-border pt-4">
          <h3 className="text-sm font-medium text-ink">Ajouter un calendrier</h3>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="source-type" className="text-sm text-ink">
              Type
            </label>
            <select
              id="source-type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'ics_ecole' | 'ics_entreprise')}
              className="rounded-md border border-border px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
            >
              <option value="ics_ecole">École (ICS)</option>
              <option value="ics_entreprise">Entreprise (ICS)</option>
            </select>
          </div>

          <Input
            label="Nom (optionnel)"
            name="label"
            placeholder="Ex : Planning BTS SIO"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <Input
            label="URL du flux ICS"
            name="url"
            placeholder="https://…/calendar.ics"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Fermer
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Ajout…' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
