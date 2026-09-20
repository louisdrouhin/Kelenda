import { http } from '../../../lib/http'

const TRACKING_BASE_URL = import.meta.env.VITE_TRACKING_API_URL ?? '/tracking'

export type TutorType = 'entreprise' | 'pedagogique'
export type InteractionType = 'visite' | 'bilan' | 'echange'

export interface TutorDto {
  id: string
  user_id: string
  type: TutorType
  name: string
  email: string | null
  phone: string | null
  availability_notes: string | null
}

export interface CreateTutorPayload {
  type: TutorType
  name: string
  email?: string
  phone?: string
  availability_notes?: string
}

export interface UpdateTutorPayload {
  type?: TutorType
  name?: string
  email?: string
  phone?: string
  availability_notes?: string
}

export interface TutorInteractionDto {
  id: string
  tutor_id: string
  interaction_date: string
  type: InteractionType
  notes: string | null
  mission_id: string | null
  mission_title: string | null
  calendar_event_id: string | null
  created_at: string
}

export interface CreateInteractionPayload {
  interaction_date: string
  type: InteractionType
  notes?: string
  mission_id?: string
}

export async function fetchTutors(): Promise<TutorDto[]> {
  const { data } = await http.get<TutorDto[]>(`${TRACKING_BASE_URL}/tutors`)
  return data
}

export async function createTutor(payload: CreateTutorPayload): Promise<TutorDto> {
  const { data } = await http.post<TutorDto>(`${TRACKING_BASE_URL}/tutors`, payload)
  return data
}

export async function updateTutor(id: string, payload: UpdateTutorPayload): Promise<TutorDto> {
  const { data } = await http.patch<TutorDto>(`${TRACKING_BASE_URL}/tutors/${id}`, payload)
  return data
}

export async function fetchTutorInteractions(tutorId: string): Promise<TutorInteractionDto[]> {
  const { data } = await http.get<TutorInteractionDto[]>(`${TRACKING_BASE_URL}/tutors/${tutorId}/interactions`)
  return data
}

export async function createTutorInteraction(
  tutorId: string,
  payload: CreateInteractionPayload,
): Promise<TutorInteractionDto> {
  const { data } = await http.post<TutorInteractionDto>(`${TRACKING_BASE_URL}/tutors/${tutorId}/interactions`, payload)
  return data
}
