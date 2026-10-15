export function answerError(answer: string): string | null {
  const text = answer.trim()
  if (!text) return 'Escribe la respuesta.'
  if (text.length > 2000) return 'La respuesta es demasiado larga.'
  return null
}

export function sameQuestion(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

export function withoutQuestion<T extends { question: string }>(items: T[], question: string): T[] {
  return items.filter((item) => !sameQuestion(item.question, question))
}

export function hasConversation(conversationId: string): boolean {
  return conversationId.trim().length > 0
}

export function latestAnswered<T extends { question: string; answeredAt?: string | null }>(items: T[]): T[] {
  const ranked = [...items].sort((left, right) => (right.answeredAt ?? '').localeCompare(left.answeredAt ?? ''))
  const seen = new Set<string>()
  const chosen: T[] = []
  for (const item of ranked) {
    const key = item.question.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    chosen.push(item)
  }
  return chosen
}
