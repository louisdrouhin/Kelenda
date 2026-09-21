import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { fetchMissions, type MissionDto, type MissionStatus } from '../api/missions-api'
import { fetchTutors, type TutorDto } from '../api/tutors-api'
import { MissionFormModal } from '../components/MissionFormModal'
import { TutorFormModal } from '../components/TutorFormModal'
import { TutorInteractionsModal } from '../components/TutorInteractionsModal'

const statusLabels: Record<MissionStatus, string> = {
  in_progress: 'En cours',
  done: 'Terminée',
  cancelled: 'Annulée',
}

const statusStyles: Record<MissionStatus, string> = {
  in_progress: 'bg-blue-50 text-[#08070C]',
  done: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
}

const tutorTypeLabels: Record<TutorDto['type'], string> = {
  entreprise: 'Entreprise',
  pedagogique: 'Pédagogique',
}

function formatDateRange(mission: MissionDto): string {
  const start = new Date(mission.start_date).toLocaleDateString('fr-FR')
  if (!mission.end_date) return `Depuis le ${start}`
  const end = new Date(mission.end_date).toLocaleDateString('fr-FR')
  return `${start} → ${end}`
}

export function MissionsPage() {
  const [statusFilter, setStatusFilter] = useState<MissionStatus | undefined>(undefined)
  const [editingMission, setEditingMission] = useState<MissionDto | null>(null)
  const [creatingMission, setCreatingMission] = useState(false)
  const [editingTutor, setEditingTutor] = useState<TutorDto | null>(null)
  const [creatingTutor, setCreatingTutor] = useState(false)
  const [interactionsTutor, setInteractionsTutor] = useState<TutorDto | null>(null)

  const { data: missions = [], isLoading: missionsLoading, isError: missionsError } = useQuery({
    queryKey: ['tracking', 'missions', statusFilter ?? 'all'],
    queryFn: () => fetchMissions(statusFilter),
  })

  const { data: tutors = [], isLoading: tutorsLoading, isError: tutorsError } = useQuery({
    queryKey: ['tracking', 'tutors'],
    queryFn: fetchTutors,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex items-center justify-between gap-4 px-10 pt-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl text-ink">Missions</h1>
          <p className="text-sm text-ink/60">Suivi de tes missions en entreprise et de tes tuteurs.</p>
        </div>
        <Button onClick={() => setCreatingMission(true)}>+ Mission</Button>
      </div>

      <div className="flex items-center gap-2 px-10 pt-6">
        {([undefined, 'in_progress', 'done', 'cancelled'] as const).map((s) => (
          <button
            key={s ?? 'all'}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              statusFilter === s ? 'border-ink bg-ink text-white' : 'border-border text-ink/60 hover:text-ink'
            }`}
          >
            {s ? statusLabels[s] : 'Toutes'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 px-10 py-6">
        {missionsError && <p className="text-sm text-red-500">Impossible de charger les missions.</p>}
        {missionsLoading && <p className="text-sm text-ink/50">Chargement…</p>}
        {!missionsLoading && !missionsError && missions.length === 0 && (
          <p className="text-sm text-ink/50">Aucune mission pour l'instant.</p>
        )}
        {missions.map((mission) => (
          <button
            key={mission.id}
            onClick={() => setEditingMission(mission)}
            className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 text-left transition-colors hover:border-ink/30 hover:bg-cream"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm text-ink">{mission.title}</span>
              <span className="text-xs text-ink/50">{formatDateRange(mission)}</span>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${statusStyles[mission.status]}`}>
              {statusLabels[mission.status]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border px-10 pt-6">
        <h2 className="text-lg text-ink">Tuteurs</h2>
        <Button variant="secondary" onClick={() => setCreatingTutor(true)}>
          + Tuteur
        </Button>
      </div>

      <div className="flex flex-col gap-2 px-10 py-6">
        {tutorsError && <p className="text-sm text-red-500">Impossible de charger les tuteurs.</p>}
        {tutorsLoading && <p className="text-sm text-ink/50">Chargement…</p>}
        {!tutorsLoading && !tutorsError && tutors.length === 0 && (
          <p className="text-sm text-ink/50">Aucun tuteur enregistré pour l'instant.</p>
        )}
        {tutors.map((tutor) => (
          <div
            key={tutor.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm text-ink">{tutor.name}</span>
              <span className="text-xs text-ink/50">
                {tutorTypeLabels[tutor.type]}
                {tutor.email ? ` · ${tutor.email}` : ''}
              </span>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => setInteractionsTutor(tutor)}
                className="rounded-md px-2.5 py-1.5 text-xs text-ink/70 hover:bg-cream hover:text-ink"
              >
                Suivi
              </button>
              <button
                onClick={() => setEditingTutor(tutor)}
                className="rounded-md px-2.5 py-1.5 text-xs text-ink/70 hover:bg-cream hover:text-ink"
              >
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>

      {creatingMission && <MissionFormModal onClose={() => setCreatingMission(false)} />}
      {editingMission && <MissionFormModal mission={editingMission} onClose={() => setEditingMission(null)} />}
      {creatingTutor && <TutorFormModal onClose={() => setCreatingTutor(false)} />}
      {editingTutor && <TutorFormModal tutor={editingTutor} onClose={() => setEditingTutor(null)} />}
      {interactionsTutor && (
        <TutorInteractionsModal tutor={interactionsTutor} onClose={() => setInteractionsTutor(null)} />
      )}
    </div>
  )
}
