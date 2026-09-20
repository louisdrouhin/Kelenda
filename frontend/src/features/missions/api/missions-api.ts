import { http } from '../../../lib/http'

const TRACKING_BASE_URL = import.meta.env.VITE_TRACKING_API_URL ?? '/tracking'

export type MissionStatus = 'in_progress' | 'done' | 'cancelled'

export interface MissionDto {
  id: string
  user_id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  status: MissionStatus
  related_event_id: string | null
  source: 'manual' | 'calendar'
  created_at: string
  updated_at: string
}

export interface CreateMissionPayload {
  title: string
  description?: string
  start_date: string
  end_date?: string
}

export interface UpdateMissionPayload {
  title?: string
  description?: string
  start_date?: string
  end_date?: string | null
  status?: MissionStatus
}

export async function fetchMissions(status?: MissionStatus): Promise<MissionDto[]> {
  const { data } = await http.get<MissionDto[]>(`${TRACKING_BASE_URL}/missions`, {
    params: status ? { status } : undefined,
  })
  return data
}

export async function createMission(payload: CreateMissionPayload): Promise<MissionDto> {
  const { data } = await http.post<MissionDto>(`${TRACKING_BASE_URL}/missions`, payload)
  return data
}

export async function updateMission(id: string, payload: UpdateMissionPayload): Promise<MissionDto> {
  const { data } = await http.patch<MissionDto>(`${TRACKING_BASE_URL}/missions/${id}`, payload)
  return data
}

export async function deleteMission(id: string): Promise<void> {
  await http.delete(`${TRACKING_BASE_URL}/missions/${id}`)
}
