import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, Shield } from 'lucide-react'
import type { Conversation, Language } from '../api/types'
import { useAdmin } from '../auth/AdminContext'
import { ChatThread } from '../components/ChatThread'
import {
  activityTime,
  cn,
  formatListTime,
  formatLong,
  languageLabel,
  languageShort,
  lastPreview,
  maskPhone,
} from '../lib/format'

export function ConversationsPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { api, tenant } = useAdmin()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const lang = (params.get('lang') ?? 'all') as Language | 'all'
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const includeAnonymized = params.get('anon') !== '0'
  const [draft, setDraft] = useState(q)
  const [rows, setRows] = useState<Conversation[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(q)
  }, [q])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (draft === q) return
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (draft.trim()) next.set('q', draft.trim())
          else next.delete('q')
          return next
        },
        { replace: true },
      )
    }, 200)
    return () => window.clearTimeout(handle)
  }, [draft, q, setParams])

  useEffect(() => {
    let cancel = false
    api
      .listConversations(tenant.id, {
        q,
        language: lang,
        from: from || undefined,
        to: to || undefined,
        includeAnonymized,
      })
      .then((list) => {
        if (!cancel) setRows(list)
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : 'No se pudieron cargar.')
      })
    return () => {
      cancel = true
    }
  }, [api, tenant.id, q, lang, from, to, includeAnonymized])

  function update(partial: Record<string, string | null>) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(partial)) {
        if (!value) next.delete(key)
        else next.set(key, value)
      }
      return next
    })
  }

  return (
    <div className="flex h-full min-h-0">
      <section
        className={cn(
          'min-h-0 w-full flex-col border-line lg:flex lg:w-[390px] lg:shrink-0 lg:border-r',
          conversationId ? 'hidden' : 'flex',
        )}
      >
        <div className="border-b border-line px-4 py-4">
          <h1 className="font-display text-2xl">Conversaciones</h1>
          <p className="mt-1 text-sm text-ink-soft">Teléfono enmascarado. El historial es el de WhatsApp.</p>
          <label className="mt-3 flex items-center gap-2 rounded-2xl border border-line bg-card px-3 py-2">
            <Search className="h-4 w-4 text-ink-soft" />
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Tema, mensaje o teléfono"
              className="w-full bg-transparent text-sm outline-none"
              aria-label="Buscar conversaciones"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select
              value={lang}
              onChange={(event) => update({ lang: event.target.value === 'all' ? null : event.target.value })}
              className="rounded-xl border border-line bg-card px-2 py-2 text-sm"
              aria-label="Idioma"
            >
              <option value="all">Todos los idiomas</option>
              <option value="es">Español</option>
              <option value="ca">Català</option>
              <option value="en">English</option>
            </select>
            <label className="flex items-center gap-2 rounded-xl border border-line bg-card px-2 py-2 text-sm">
              <input
                type="checkbox"
                checked={includeAnonymized}
                onChange={(event) => update({ anon: event.target.checked ? null : '0' })}
              />
              Anonimizadas
            </label>
            <label className="text-xs text-ink-soft">
              Desde
              <input
                type="date"
                value={from}
                onChange={(event) => update({ from: event.target.value || null })}
                className="mt-1 w-full rounded-xl border border-line bg-card px-2 py-2 text-sm text-ink"
              />
            </label>
            <label className="text-xs text-ink-soft">
              Hasta
              <input
                type="date"
                value={to}
                onChange={(event) => update({ to: event.target.value || null })}
                className="mt-1 w-full rounded-xl border border-line bg-card px-2 py-2 text-sm text-ink"
              />
            </label>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {error ? <p className="px-4 py-6 text-sm text-danger">{error}</p> : null}
          {rows && rows.length === 0 ? (
            <p className="px-4 py-10 text-sm text-ink-soft">Ninguna conversación con estos filtros.</p>
          ) : null}
          <ul>
            {rows?.map((conversation) => {
              const when = activityTime(conversation)
              const selected = conversation.id === conversationId
              return (
                <li key={conversation.id}>
                  <Link
                    to={`/conversaciones/${conversation.id}?${params.toString()}`}
                    className={cn(
                      'block border-b border-line px-4 py-3 hover:bg-card',
                      selected && 'border-l-4 border-l-moss bg-card',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {conversation.anonymized ? 'Usuario anonimizado' : maskPhone(conversation.userPhone)}
                      </span>
                      <time className="shrink-0 text-[11px] text-ink-soft" dateTime={when}>
                        {when ? formatListTime(when) : ''}
                      </time>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold">
                        {languageShort(conversation.language)}
                      </span>
                      <span className="truncate text-xs text-ink-soft">{conversation.topic}</span>
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm text-ink/80">{lastPreview(conversation)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className={cn('min-h-0 min-w-0 flex-1 flex-col', conversationId ? 'flex' : 'hidden lg:flex')}>
        {conversationId ? (
          <ConversationPane
            conversationId={conversationId}
            onBack={() => navigate(`/conversaciones?${params.toString()}`)}
          />
        ) : (
          <div className="grid h-full place-items-center px-8 text-center">
            <div>
              <p className="font-display text-3xl">Elige una conversación</p>
              <p className="mt-2 max-w-sm text-sm text-ink-soft">
                A la izquierda están los hilos de {tenant.shortName}, con el último mensaje y la hora.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function ConversationPane({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const { api, tenant } = useAdmin()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    setConversation(null)
    api
      .getConversation(tenant.id, conversationId)
      .then((next) => {
        if (!cancel) setConversation(next)
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : 'No se pudo abrir.')
      })
    return () => {
      cancel = true
    }
  }, [api, tenant.id, conversationId])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-card px-3 py-3 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          className="grid h-10 w-10 place-items-center rounded-xl border border-line lg:hidden"
          aria-label="Volver al listado"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {conversation ? (
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {conversation.anonymized ? 'Usuario anonimizado' : maskPhone(conversation.userPhone)}
            </p>
            <p className="truncate text-xs text-ink-soft">
              {languageLabel(conversation.language)} · {conversation.topic}
              {conversation.anonymized ? ' · GDPR' : ''}
            </p>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">{error ?? 'Abriendo el hilo…'}</p>
        )}
      </header>
      {conversation?.anonymized ? (
        <div className="grid flex-1 place-items-center px-6">
          <div className="max-w-md rounded-3xl border border-line bg-card px-6 py-8 text-center">
            <Shield className="mx-auto h-8 w-8 text-moss" />
            <h2 className="mt-3 font-display text-2xl">Historial anonimizado</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {conversation.deletionRequestedAt
                ? `El ${formatLong(conversation.deletionRequestedAt)} esta persona envió la orden de borrado (BORRAR DATOS, ESBORRAR DADES o DELETE DATA).`
                : 'Esta persona pidió el borrado.'}{' '}
              El teléfono y los mensajes se quitaron del hilo. No queda texto que recuperar desde el portal.
            </p>
          </div>
        </div>
      ) : conversation ? (
        <div className="min-h-0 flex-1">
          <ChatThread events={conversation.events} />
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}
