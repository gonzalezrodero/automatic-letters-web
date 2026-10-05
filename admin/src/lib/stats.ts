import type { Conversation, DashboardStats, DayActivity, Language } from '../api/types'
import { activityTime, dayKey, lastPreview, maskPhone } from './format'

const WINDOW_DAYS = 7
const CHART_DAYS = 14

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function isoDay(date: Date): string {
  return dayKey(date.toISOString())
}

export function buildDashboard(conversations: Conversation[], now = new Date()): DashboardStats {
  const end = isoDay(now)
  const windowStart = isoDay(addDays(now, -(WINDOW_DAYS - 1)))
  const chartStart = isoDay(addDays(now, -(CHART_DAYS - 1)))

  const activityMap = new Map<string, DayActivity>()
  for (let i = CHART_DAYS - 1; i >= 0; i -= 1) {
    const date = addDays(now, -i)
    const key = isoDay(date)
    const label = new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      day: 'numeric',
      month: 'short',
    }).format(date)
    activityMap.set(key, { date: key, label: label.replace('.', ''), received: 0, replied: 0 })
  }

  const topicMap = new Map<string, { count: number; latest: string }>()
  const languageMap = new Map<Language, number>()
  const activePhones = new Set<string>()
  let messagesThisWeek = 0
  let deletionRequests = 0

  for (const conversation of conversations) {
    if (conversation.anonymized) {
      deletionRequests += 1
      continue
    }
    languageMap.set(conversation.language, (languageMap.get(conversation.language) ?? 0) + 1)

    for (const event of conversation.events) {
      const key = dayKey(event.at)
      const bucket = activityMap.get(key)
      if (bucket) {
        if (event.type === 'MessageReceived') bucket.received += 1
        else bucket.replied += 1
      }
      if (event.type === 'MessageReceived') {
        const current = topicMap.get(conversation.topic) ?? { count: 0, latest: '' }
        current.count += 1
        if (event.at > current.latest) current.latest = event.at
        topicMap.set(conversation.topic, current)
      }
      if (key >= windowStart && key <= end) {
        messagesThisWeek += 1
        if (event.type === 'MessageReceived' && conversation.userPhone) {
          activePhones.add(conversation.userPhone)
        }
      }
    }
  }

  const topics = [...topicMap.entries()]
    .sort((a, b) => b[1].count - a[1].count || b[1].latest.localeCompare(a[1].latest))
    .map(([topic, info]) => ({ topic, count: info.count }))

  const languages = (['es', 'ca', 'en'] as const)
    .map((language) => ({ language, count: languageMap.get(language) ?? 0 }))
    .filter((item) => item.count > 0)

  const recent = [...conversations]
    .sort((a, b) => activityTime(b).localeCompare(activityTime(a)))
    .slice(0, 4)
    .map((conversation) => ({
      id: conversation.id,
      topic: conversation.topic,
      language: conversation.language,
      preview: lastPreview(conversation),
      at: activityTime(conversation),
      anonymized: conversation.anonymized,
      phoneMasked: conversation.anonymized ? 'Número eliminado' : maskPhone(conversation.userPhone),
    }))

  const windowStartDate = addDays(now, -(WINDOW_DAYS - 1))
  const windowLabel = `${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' }).format(windowStartDate)} – ${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' }).format(now)}`

  return {
    generatedAt: now.toISOString(),
    windowLabel,
    conversationCount: conversations.length,
    messagesThisWeek,
    activeUsers: activePhones.size,
    deletionRequests,
    topTopic: topics[0] ?? null,
    topics: topics.slice(0, 5),
    languages,
    activity: [...activityMap.values()].filter((day) => day.date >= chartStart),
    recent,
  }
}

export function inDateRange(iso: string, from?: string, to?: string): boolean {
  const key = dayKey(iso)
  if (from && key < from) return false
  if (to && key > to) return false
  return true
}
