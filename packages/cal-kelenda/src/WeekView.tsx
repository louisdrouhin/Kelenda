import { useCallback, useRef, useState } from 'react'
import { categoryStyles } from './category-styles'
import { addDays, formatDayNumber, formatTime, formatWeekdayLabel, isSameDay, layoutOverlappingEvents, minutesSinceMidnight } from './date-utils'
import type { CalendarEvent } from './types'

const HOUR_HEIGHT_PX = 56
const START_HOUR = 0
const END_HOUR = 24
const SNAP_MINUTES = 15
// Distance minimale (px) avant qu'un pointerdown+move soit traité comme un
// drag plutôt qu'un clic — sans ce seuil, le moindre tremblement de souris
// pendant un clic déplace l'événement au lieu d'ouvrir son édition.
const DRAG_THRESHOLD_PX = 5

interface WeekViewProps {
  weekStart: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onSlotClick?: (date: Date) => void
  /** Appelé quand un événement éditable est déplacé (drag) vers un nouveau créneau. */
  onEventMove?: (event: CalendarEvent, newStartAt: string, newEndAt: string) => void
  /** Nombre de jours affichés à partir de weekStart — 7 pour la vue semaine, 1 pour la vue jour. */
  daysToShow?: number
}

function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
}

interface DragState {
  event: CalendarEvent
  durationMs: number
  // Décalage en minutes entre le haut de l'événement et le point de clic initial.
  grabOffsetMinutes: number
}

export function WeekView({ weekStart, events, onEventClick, onSlotClick, onEventMove, daysToShow = 7 }: WeekViewProps) {
  const days = Array.from({ length: daysToShow }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const totalHeight = hours.length * HOUR_HEIGHT_PX

  const timedEvents = events.filter((e) => !e.allDay)
  const allDayEvents = events.filter((e) => e.allDay)
  const gridTemplateColumns = `56px repeat(${daysToShow}, 1fr)`

  const gridRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [dragPreview, setDragPreview] = useState<{ dayIndex: number; startMinutes: number } | null>(null)
  const dragMovedRef = useRef(false)

  const computeDayIndexAndMinutes = useCallback(
    (clientX: number, clientY: number) => {
      const grid = gridRef.current
      if (!grid) return null
      const rect = grid.getBoundingClientRect()
      const dayColumnWidth = rect.width / daysToShow
      const dayIndex = Math.min(daysToShow - 1, Math.max(0, Math.floor((clientX - rect.left) / dayColumnWidth)))
      const minutesFromTop = ((clientY - rect.top) / HOUR_HEIGHT_PX) * 60 + START_HOUR * 60
      return { dayIndex, minutesFromTop }
    },
    [daysToShow],
  )

  function handlePointerDownOnEvent(e: React.PointerEvent, event: CalendarEvent) {
    if (!event.editable) return
    e.stopPropagation()
    e.preventDefault()

    const start = new Date(event.startAt)
    const end = new Date(event.endAt)
    const grid = gridRef.current
    if (!grid) return
    const rect = grid.getBoundingClientRect()
    const clickMinutesFromTop = ((e.clientY - rect.top) / HOUR_HEIGHT_PX) * 60 + START_HOUR * 60
    const grabOffsetMinutes = clickMinutesFromTop - minutesSinceMidnight(start)
    const pointerDownX = e.clientX
    const pointerDownY = e.clientY

    dragMovedRef.current = false
    let dragStarted = false

    function handlePointerMove(moveEvent: PointerEvent) {
      if (!dragStarted) {
        const dx = moveEvent.clientX - pointerDownX
        const dy = moveEvent.clientY - pointerDownY
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        dragStarted = true
        dragMovedRef.current = true
        setDrag({
          event,
          durationMs: end.getTime() - start.getTime(),
          grabOffsetMinutes,
        })
      }
      const location = computeDayIndexAndMinutes(moveEvent.clientX, moveEvent.clientY)
      if (!location) return
      const rawStart = location.minutesFromTop - grabOffsetMinutes
      const snappedStart = Math.min(24 * 60 - 1, Math.max(0, snapMinutes(rawStart)))
      setDragPreview({ dayIndex: location.dayIndex, startMinutes: snappedStart })
    }

    function handlePointerUp(upEvent: PointerEvent) {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)

      const location = computeDayIndexAndMinutes(upEvent.clientX, upEvent.clientY)
      if (location && dragMovedRef.current && onEventMove) {
        const rawStart = location.minutesFromTop - grabOffsetMinutes
        const snappedStartMinutes = Math.min(24 * 60 - 1, Math.max(0, snapMinutes(rawStart)))

        const newStart = addDays(weekStart, location.dayIndex)
        newStart.setHours(0, snappedStartMinutes, 0, 0)
        const newEnd = new Date(newStart.getTime() + (end.getTime() - start.getTime()))

        onEventMove(event, newStart.toISOString(), newEnd.toISOString())
      } else if (!dragMovedRef.current) {
        onEventClick?.(event)
      }

      setDrag(null)
      setDragPreview(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="grid border-b border-border" style={{ gridTemplateColumns }}>
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="flex flex-col items-center gap-0.5 border-l border-border py-2">
            <span className="text-[11px] uppercase text-ink/45">{formatWeekdayLabel(day)}</span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                isSameDay(day, new Date()) ? 'bg-ink text-white' : 'text-ink'
              }`}
            >
              {formatDayNumber(day)}
            </span>
          </div>
        ))}
      </div>

      {allDayEvents.length > 0 && (
        <div className="grid border-b border-border" style={{ gridTemplateColumns }}>
          <div />
          {days.map((day) => (
            <div key={day.toISOString()} className="flex flex-col gap-1 border-l border-border p-1">
              {allDayEvents
                .filter((e) => isSameDay(new Date(e.startAt), day))
                .map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onEventClick?.(e)}
                    className={`truncate rounded px-1.5 py-0.5 text-left text-xs ${categoryStyles[e.category].bg} ${categoryStyles[e.category].text} ${categoryStyles[e.category].border}`}
                  >
                    {e.title}
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div ref={gridRef} className="grid" style={{ height: totalHeight, gridTemplateColumns }}>
          <div className="relative">
            {hours.map((hour) =>
              hour === START_HOUR ? null : (
                <span
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-ink/40"
                  style={{ top: (hour - START_HOUR) * HOUR_HEIGHT_PX }}
                >
                  {hour.toString().padStart(2, '0')}:00
                </span>
              ),
            )}
          </div>

          {days.map((day, dayIndex) => {
            const dayEvents = timedEvents.filter(
              (e) => isSameDay(new Date(e.startAt), day) && !(drag && drag.event.id === e.id),
            )
            const laidOut = layoutOverlappingEvents(dayEvents.map((e) => ({ ...e, startAt: e.startAt, endAt: e.endAt })))

            return (
              <div key={day.toISOString()} className="relative border-l border-border">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    onClick={() => {
                      const clicked = new Date(day)
                      clicked.setHours(hour, 0, 0, 0)
                      onSlotClick?.(clicked)
                    }}
                    className="block w-full border-b border-border/60 hover:bg-cream/60"
                    style={{ height: HOUR_HEIGHT_PX }}
                  />
                ))}

                {laidOut.map(({ event, columnIndex, columnCount }) => {
                  const start = new Date(event.startAt)
                  const end = new Date(event.endAt)
                  const top = ((minutesSinceMidnight(start) - START_HOUR * 60) / 60) * HOUR_HEIGHT_PX
                  const height = Math.max(((minutesSinceMidnight(end) - minutesSinceMidnight(start)) / 60) * HOUR_HEIGHT_PX, 18)
                  const widthPct = 100 / columnCount
                  const style = categoryStyles[event.category]

                  return (
                    <div
                      key={event.id}
                      onPointerDown={(e) => handlePointerDownOnEvent(e, event)}
                      onClick={() => {
                        if (!event.editable) onEventClick?.(event)
                      }}
                      className={`absolute select-none overflow-hidden rounded-md px-1.5 py-1 text-left text-xs shadow-sm ${style.bg} ${style.text} ${style.border} ${
                        event.editable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                      }`}
                      style={{
                        top,
                        height,
                        left: `${columnIndex * widthPct}%`,
                        width: `calc(${widthPct}% - 2px)`,
                      }}
                    >
                      <div className="truncate font-medium">{event.title}</div>
                      <div className="truncate text-[10px] opacity-70">{formatTime(start)}</div>
                    </div>
                  )
                })}

                {drag && dragPreview && dragPreview.dayIndex === dayIndex && (
                  <div
                    className={`pointer-events-none absolute overflow-hidden rounded-md px-1.5 py-1 text-left text-xs opacity-70 ring-2 ring-ink/40 ${categoryStyles[drag.event.category].bg} ${categoryStyles[drag.event.category].text}`}
                    style={{
                      top: ((dragPreview.startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT_PX,
                      height: Math.max((drag.durationMs / 60000 / 60) * HOUR_HEIGHT_PX, 18),
                      left: 0,
                      width: 'calc(100% - 2px)',
                    }}
                  >
                    <div className="truncate font-medium">{drag.event.title}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
