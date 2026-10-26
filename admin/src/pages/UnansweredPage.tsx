import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isUnavailable } from '../api/errors'
import type { AnsweredQuestion, UnansweredQuestion } from '../api/types'
import { useAdmin } from '../auth/AdminContext'
import { NotReady } from '../components/NotReady'
import { formatListTime } from '../lib/format'
import { answerError, hasConversation } from '../lib/unanswered'
import { tenantShortLabel } from '../lib/tenantLabel'

export function UnansweredPage() {
  const { api, tenant } = useAdmin()
  const [questions, setQuestions] = useState<UnansweredQuestion[] | null>(null)
  const [answered, setAnswered] = useState<AnsweredQuestion[] | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [corrections, setCorrections] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [discardingId, setDiscardingId] = useState<string | null>(null)
  const view = useRef(0)

  function show(
    ticket: number,
    open: UnansweredQuestion[],
    closed: AnsweredQuestion[],
  ) {
    if (ticket !== view.current) return
    setQuestions(open)
    setAnswered(closed)
    setCorrections(Object.fromEntries(closed.map((item) => [item.id, item.answer])))
  }

  useEffect(() => {
    const ticket = ++view.current
    const requested = tenant.id
    setQuestions(null)
    setAnswered(null)
    setError(null)
    setSavingId(null)
    setConfirmingId(null)
    setDiscardingId(null)
    Promise.all([api.listUnanswered(requested), api.listAnswered(requested)])
      .then(([open, closed]) => show(ticket, open, closed))
      .catch((reason: unknown) => {
        if (ticket !== view.current) return
        if (isUnavailable(reason)) setUnavailable(true)
        else setError(reason instanceof Error ? reason.message : 'No hemos podido cargar las preguntas. Vuelve a intentarlo.')
      })
    return () => {
      view.current += 1
    }
  }, [api, tenant.id])

  async function reload(requested: string, ticket: number) {
    const [open, closed] = await Promise.all([
      api.listUnanswered(requested),
      api.listAnswered(requested),
    ])
    show(ticket, open, closed)
  }

  async function save(question: UnansweredQuestion) {
    const problem = answerError(drafts[question.id] ?? '')
    if (problem) {
      setError(problem)
      return
    }

    const requested = tenant.id
    const ticket = view.current
    setSavingId(question.id)
    setError(null)
    try {
      await api.answerUnanswered(requested, question.id, (drafts[question.id] ?? '').trim())
      await reload(requested, ticket)
    } catch (reason) {
      if (ticket !== view.current) return
      setError(reason instanceof Error ? reason.message : 'No hemos podido guardar la respuesta. Vuelve a intentarlo.')
    } finally {
      if (ticket === view.current) setSavingId(null)
    }
  }

  async function revise(question: AnsweredQuestion) {
    const problem = answerError(corrections[question.id] ?? '')
    if (problem) {
      setError(problem)
      return
    }

    const requested = tenant.id
    const ticket = view.current
    setSavingId(question.id)
    setError(null)
    try {
      await api.reviseUnanswered(requested, question.id, (corrections[question.id] ?? '').trim())
      await reload(requested, ticket)
    } catch (reason) {
      if (ticket !== view.current) return
      setError(reason instanceof Error ? reason.message : 'No hemos podido corregir la respuesta. Vuelve a intentarlo.')
    } finally {
      if (ticket === view.current) setSavingId(null)
    }
  }

  async function discard(question: UnansweredQuestion) {
    const requested = tenant.id
    const ticket = view.current
    setSavingId(question.id)
    setError(null)
    try {
      await api.discardUnanswered(requested, question.id)
      if (ticket !== view.current) return
      setDiscardingId(null)
      await reload(requested, ticket)
    } catch (reason) {
      if (ticket !== view.current) return
      setError(reason instanceof Error ? reason.message : 'No hemos podido descartar la pregunta. Vuelve a intentarlo.')
    } finally {
      if (ticket === view.current) setSavingId(null)
    }
  }

  async function withdraw(question: AnsweredQuestion) {
    const requested = tenant.id
    const ticket = view.current
    setSavingId(question.id)
    setError(null)
    try {
      await api.withdrawUnanswered(requested, question.id)
      if (ticket !== view.current) return
      setConfirmingId(null)
      await reload(requested, ticket)
    } catch (reason) {
      if (ticket !== view.current) return
      setError(reason instanceof Error ? reason.message : 'No hemos podido quitar la respuesta. Vuelve a intentarlo.')
    } finally {
      if (ticket === view.current) setSavingId(null)
    }
  }

  if (unavailable) {
    return (
      <NotReady
        title="Las preguntas sin respuesta todavía no están disponibles"
        detail="Cuando el bot no sepa algo, esa pregunta aparecerá aquí para añadirla al conocimiento."
      />
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
        <h1 className="font-display text-4xl">Sin respuesta</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Preguntas que el bot de {tenantShortLabel(tenant)} no pudo contestar con los documentos. Escribe la
          respuesta una vez y pasa al conocimiento. La próxima persona ya la recibe.
        </p>
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        {questions && questions.length === 0 ? (
          <p className="mt-8 text-sm text-ink-soft">No hay preguntas pendientes.</p>
        ) : null}
        <ul className="mt-6 space-y-4">
          {questions?.map((question) => (
            <li key={question.id} className="rounded-3xl border border-line bg-card p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{question.question}</p>
                <time className="shrink-0 text-xs text-ink-soft" dateTime={question.askedAt}>
                  {formatListTime(question.askedAt)}
                </time>
              </div>
              <label className="mt-4 block text-sm text-ink-soft">
                Respuesta
                <textarea
                  value={drafts[question.id] ?? ''}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [question.id]: event.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none"
                />
              </label>
              <div className="mt-3 flex items-center justify-between gap-3">
                {hasConversation(question.conversationId) ? (
                  <Link
                    to={`/conversaciones/${question.conversationId}`}
                    className="text-sm font-medium text-moss-deep hover:underline"
                  >
                    Ver la conversación
                  </Link>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-3">
                  {discardingId === question.id ? (
                    <button
                      type="button"
                      className="text-sm font-medium text-danger"
                      disabled={savingId === question.id}
                      onClick={() => void discard(question)}
                    >
                      {savingId === question.id ? 'Descartando…' : 'Confirmar'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-sm font-medium text-ink-soft hover:text-danger"
                      onClick={() => setDiscardingId(question.id)}
                    >
                      Descartar
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={savingId === question.id}
                    onClick={() => void save(question)}
                    className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {savingId === question.id && discardingId !== question.id ? 'Guardando…' : 'Guardar en el conocimiento'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 font-display text-3xl">Contestadas</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Respuestas que ya forman parte del conocimiento. Corregir una vuelve a publicar el archivo.
        </p>
        {answered && answered.length === 0 ? (
          <p className="mt-8 text-sm text-ink-soft">Todavía no hay respuestas guardadas.</p>
        ) : null}
        <ul className="mt-6 space-y-4">
          {answered?.map((question) => (
            <li key={question.id} className="rounded-3xl border border-line bg-card p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{question.question}</p>
                <time className="shrink-0 text-xs text-ink-soft" dateTime={question.answeredAt}>
                  {formatListTime(question.answeredAt)}
                </time>
              </div>
              <label className="mt-4 block text-sm text-ink-soft">
                Respuesta
                <textarea
                  value={corrections[question.id] ?? question.answer}
                  onChange={(event) =>
                    setCorrections((current) => ({ ...current, [question.id]: event.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none"
                />
              </label>
              <div className="mt-3 flex items-center justify-end gap-3">
                {confirmingId === question.id ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-danger"
                    disabled={savingId === question.id}
                    onClick={() => void withdraw(question)}
                  >
                    Confirmar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-sm font-medium text-ink-soft hover:text-danger"
                    onClick={() => setConfirmingId(question.id)}
                  >
                    Quitar del conocimiento
                  </button>
                )}
                <button
                  type="button"
                  disabled={savingId === question.id}
                  onClick={() => void revise(question)}
                  className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingId === question.id ? 'Guardando…' : 'Guardar corrección'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
