export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Semaine ISO : lundi -> dimanche
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay() // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day
  return addDays(d, diff)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

export function formatWeekdayLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' })
}

export function formatDayNumber(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric' })
}

export function formatMonthYear(date: Date): string {
  const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function formatWeekRangeLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
  const startLabel = weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: sameMonth ? undefined : 'short' })
  const endLabel = weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startLabel} – ${endLabel}`
}

/**
 * Regroupe des événements qui se chevauchent dans le temps en "colonnes" pour
 * un affichage côte à côte dans la grille horaire (comme Google Calendar).
 * Retourne, pour chaque événement, son index de colonne et le nombre total
 * de colonnes du groupe auquel il appartient.
 */
export interface LaidOutEvent<T> {
  event: T
  columnIndex: number
  columnCount: number
}

export function layoutOverlappingEvents<T extends { startAt: string; endAt: string }>(
  events: T[],
): LaidOutEvent<T>[] {
  const sorted = [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  const result: LaidOutEvent<T>[] = []

  let cluster: T[] = []
  let clusterEnd = -Infinity

  function flushCluster() {
    if (cluster.length === 0) return
    const columns: number[] = [] // fin (timestamp) de chaque colonne active
    const assigned: { event: T; columnIndex: number }[] = []

    for (const event of cluster) {
      const start = new Date(event.startAt).getTime()
      const end = new Date(event.endAt).getTime()
      let placed = false
      for (let i = 0; i < columns.length; i++) {
        if (columns[i] <= start) {
          columns[i] = end
          assigned.push({ event, columnIndex: i })
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push(end)
        assigned.push({ event, columnIndex: columns.length - 1 })
      }
    }

    const columnCount = columns.length
    for (const { event, columnIndex } of assigned) {
      result.push({ event, columnIndex, columnCount })
    }
    cluster = []
    clusterEnd = -Infinity
  }

  for (const event of sorted) {
    const start = new Date(event.startAt).getTime()
    if (cluster.length > 0 && start >= clusterEnd) {
      flushCluster()
    }
    cluster.push(event)
    clusterEnd = Math.max(clusterEnd, new Date(event.endAt).getTime())
  }
  flushCluster()

  return result
}
