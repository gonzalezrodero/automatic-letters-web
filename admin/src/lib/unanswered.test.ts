import { describe, expect, it } from 'vitest'
import { answerError, hasConversation, latestAnswered, sameQuestion, withoutQuestion } from './unanswered'

describe('unanswered answers', () => {
  it('asks for a written answer and rejects one that is too long', () => {
    expect(answerError('   ')).toBe('Escribe la respuesta.')
    expect(answerError('a'.repeat(2001))).toBe('La respuesta es demasiado larga.')
    expect(answerError('  Abre a las 9.  ')).toBeNull()
  })

  it('drops every pending question with the same wording', () => {
    const open = [
      { id: '1', question: '¿A qué hora abre?' },
      { id: '2', question: ' ¿a qué hora abre? ' },
      { id: '3', question: '¿Dónde es?' },
    ]

    expect(sameQuestion(open[0].question, open[1].question)).toBe(true)
    expect(withoutQuestion(open, open[0].question).map((item) => item.id)).toEqual(['3'])
  })

  it('hides the conversation once its link has been cut', () => {
    expect(hasConversation('abc')).toBe(true)
    expect(hasConversation('  ')).toBe(false)
  })

  it('keeps the latest answer for each question', () => {
    const items = [
      { question: 'Horario', answeredAt: '2026-10-01T00:00:00Z', answer: 'A las 8.' },
      { question: ' horario ', answeredAt: '2026-10-02T00:00:00Z', answer: 'A las 9.' },
      { question: 'Lugar', answeredAt: '2026-10-03T00:00:00Z', answer: 'En la pista.' },
    ]

    expect(latestAnswered(items).map((item) => item.answer)).toEqual(['En la pista.', 'A las 9.'])
  })
})
