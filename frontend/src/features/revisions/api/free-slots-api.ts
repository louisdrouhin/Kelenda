import { http } from '../../../lib/http'

const CALENDAR_BASE_URL = import.meta.env.VITE_CALENDAR_API_URL ?? '/calendar'

export interface FreeSlot {
  start_at: string
  end_at: string
  duration_minutes: number
}

export interface FreeSlotsParams {
  from: Date
  to: Date
  minDurationMinutes: number
  workingHoursStart: number
  workingHoursEnd: number
}

export async function fetchFreeSlots(params: FreeSlotsParams): Promise<FreeSlot[]> {
  const { data } = await http.get<FreeSlot[]>(`${CALENDAR_BASE_URL}/free-slots`, {
    params: {
      from: params.from.toISOString(),
      to: params.to.toISOString(),
      min_duration_minutes: params.minDurationMinutes,
      working_hours_start: params.workingHoursStart,
      working_hours_end: params.workingHoursEnd,
    },
  })
  return data
}

export interface AcceptSlotPayload {
  title: string
  start_at: string
  end_at: string
}

export interface AcceptedSlot {
  id: string
  title: string
  start_at: string
  end_at: string
}

export async function acceptFreeSlot(payload: AcceptSlotPayload): Promise<AcceptedSlot> {
  const { data } = await http.post<AcceptedSlot>(`${CALENDAR_BASE_URL}/free-slots/accept`, payload)
  return data
}
