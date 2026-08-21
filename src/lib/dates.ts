import { format, isThisWeek, isToday, isYesterday, parseISO } from 'date-fns'

function toDate(iso: string) {
  const date = parseISO(iso)
  if (!Number.isNaN(date.getTime())) return date
  const fallback = new Date(iso)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

export function formatInboxTime(iso: string) {
  const date = toDate(iso)
  if (!date) return ''
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'dd MMM')
}

export function formatMessageTime(iso: string) {
  const date = toDate(iso)
  if (!date) return ''
  return format(date, 'HH:mm')
}

export function formatDayLabel(iso: string) {
  const date = toDate(iso)
  if (!date) return ''
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'd MMMM yyyy')
}

export function formatSearchGroupLabel(iso: string) {
  const date = toDate(iso)
  if (!date) return ''
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  if (isThisWeek(date, { weekStartsOn: 1 })) return format(date, 'EEEE')
  return format(date, 'dd/MM/yyyy')
}

export function getDayKey(iso: string) {
  const date = toDate(iso)
  if (!date) return 'unknown'
  return format(date, 'yyyy-MM-dd')
}
