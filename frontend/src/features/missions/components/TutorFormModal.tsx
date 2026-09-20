import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/toast-context'
import { createTutor, updateTutor, type TutorDto, type TutorType } from '../api/tutors-api'

const typeLabels: Record<TutorType, string> = {
  entreprise: 'Tuteur entreprise',
  pedagogique: 'Tuteur pédagogique',
}

interface TutorFormModalProps {
  tutor?: TutorDto
  onClose: () => void
}

export function TutorFormModal({ tutor, onClose }: TutorFormModalProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const isEditing = !!tutor

  const [type, setType] = useState<TutorType>(tutor?.type ?? 'entreprise')
  const [name, setName] = useState(tutor?.name ?? '')
  const [email, setEmail] = useState(tutor?.email ?? '')
  const [phone, setPhone] = useState(tutor?.phone ?? '')
  const [notes, setNotes] = useState(tutor?.availability_notes ?? '')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { type, name, email: email || undefined, phone: phone || undefined, availability_notes: notes || undefined }
      return isEditing ? updateTutor(tutor.id, payload) : createTutor(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking', 'tutors'] })
      showToast(isEditing ? 'Tuteur modifié.' : 'Tuteur ajouté.')
      onClose()
    },
    onError: () => setError('Impossible d\'enregistrer ce tuteur.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    mutation.mutate()
  }

  return (
    <Modal title={isEditing ? 'Modifier le tuteur' : 'Ajouter un tuteur'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className="text-sm text-ink">
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as TutorType)}
            className="rounded-md border border-border px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
          >
            {(Object.keys(typeLabels) as TutorType[]).map((t) => (
              <option key={t} value={t}>
                {typeLabels[t]}
              </option>
            ))}
          </select>
        </div>

        <Input label="Nom" name="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <Input label="Email (optionnel)" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Téléphone (optionnel)" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-sm text-ink">
            Disponibilités (optionnel)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="rounded-md border border-border px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Enregistrement…' : isEditing ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
