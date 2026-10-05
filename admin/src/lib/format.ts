import type { Conversation, ConversationEvent, Language } from '../api/types'

const MADRID = 'Europe/Madrid'

export function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '')
  if (!digits) return 'Número eliminado'
  if (digits.startsWith('34') && digits.length === 11) {
    const local = digits.slice(2)
    return `+34 ${local.slice(0, 3)} ** ** ${local.slice(-2)}`
  }
  const cc = digits.startsWith('44') ? '44' : digits.startsWith('33') ? '33' : digits.slice(0, 2)
  const rest = digits.slice(cc.length)
  if (rest.length < 4) return `+${cc} ***`
  return `+${cc} ${rest.slice(0, 2)}** *** *${rest.slice(-2)}`
}

export function languageLabel(language: Language): string {
  if (language === 'es') return 'Español'
  if (language === 'ca') return 'Català'
  return 'English'
}

export function languageShort(language: Language): string {
  return language.toUpperCase()
}

function madridParts(date: Date) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function dayKey(iso: string): string {
  return madridParts(new Date(iso))
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: MADRID,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDayHeading(isoDay: string, now = new Date()): string {
  const today = madridParts(now)
  const yesterday = madridParts(new Date(now.getTime() - 24 * 60 * 60 * 1000))
  if (isoDay === today) return 'Hoy'
  if (isoDay === yesterday) return 'Ayer'
  const date = new Date(`${isoDay}T12:00:00+02:00`)
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: MADRID,
    day: 'numeric',
    month: 'long',
  }).format(date)
}

export function formatListTime(iso: string, now = new Date()): string {
  const key = dayKey(iso)
  const today = madridParts(now)
  const yesterday = madridParts(new Date(now.getTime() - 24 * 60 * 60 * 1000))
  const time = formatTime(iso)
  if (key === today) return `hoy, ${time}`
  if (key === yesterday) return `ayer, ${time}`
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat('es-ES', {
    timeZone: MADRID,
    day: 'numeric',
    month: 'short',
  }).format(date)
  return `${day}, ${time}`
}

export function formatLong(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: MADRID,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`
}

export function activityTime(conversation: Conversation): string {
  const last = conversation.events[conversation.events.length - 1]
  return last?.at ?? conversation.deletionRequestedAt ?? ''
}

export function lastPreview(conversation: Conversation): string {
  if (conversation.anonymized) return 'Historial anonimizado tras una solicitud de borrado.'
  const last = [...conversation.events].reverse().find((event) => event.text.trim())
  if (!last) return 'Sin mensajes'
  const prefix = last.type === 'ReplyGenerated' ? 'Bot · ' : ''
  return prefix + last.text
}

export function isReply(event: ConversationEvent): boolean {
  return event.type === 'ReplyGenerated'
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
