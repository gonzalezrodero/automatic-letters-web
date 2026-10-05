import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, MessagesSquare, Shield, Sparkles, Users } from 'lucide-react'
import { isUnavailable } from '../api/errors'
import type { DashboardStats } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useAdmin } from '../auth/AdminContext'
import { ActivityChart, LanguageMix, TopicBars } from '../components/Charts'
import { NotReady } from '../components/NotReady'
import { formatListTime, languageShort } from '../lib/format'
import { tenantShortLabel } from '../lib/tenantLabel'

export function DashboardPage() {
  const { session } = useAuth()
  const { api, tenant } = useAdmin()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let cancel = false
    setStats(null)
    api
      .getDashboard(tenant.id)
      .then((next) => {
        if (!cancel) setStats(next)
      })
      .catch((reason: unknown) => {
        if (cancel) return
        if (isUnavailable(reason)) setUnavailable(true)
        else setError(reason instanceof Error ? reason.message : 'No se pudo cargar el panel.')
      })
    return () => {
      cancel = true
    }
  }, [api, tenant.id])

  if (unavailable) {
    return (
      <NotReady
        title="El panel todavía no está en el API"
        detail="Organizaciones y ajustes sí. Conversaciones, documentos y el resumen semanal se añadirán cuando el API los tenga."
      />
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-ink-soft">
              {stats ? `Semana del ${stats.windowLabel}` : 'Cargando la semana…'}
            </p>
            <h1 className="mt-1 font-display text-4xl tracking-tight">
              Hola, {session?.name.split(' ')[0]}
            </h1>
            <p className="mt-2 max-w-xl text-ink-soft">
              Así ha hablado el bot de {tenantShortLabel(tenant)} esta semana.
            </p>
          </div>
        </div>

        {error ? <p className="mt-6 text-sm text-danger">{error}</p> : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            icon={MessagesSquare}
            label="Conversaciones"
            value={stats ? String(stats.conversationCount) : '—'}
            hint="hilos guardados"
          />
          <Stat
            icon={MessageCircle}
            label="Mensajes · 7 días"
            value={stats ? String(stats.messagesThisWeek) : '—'}
            hint="recibidos y respuestas"
          />
          <Stat
            icon={Users}
            label="Usuarios activos"
            value={stats ? String(stats.activeUsers) : '—'}
            hint="teléfonos distintos"
          />
          <Stat
            icon={Sparkles}
            label="Tema más preguntado"
            value={stats?.topTopic?.topic ?? '—'}
            hint={stats?.topTopic ? `${stats.topTopic.count} preguntas` : 'sin datos'}
            small
          />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-5">
          <article className="rounded-3xl border border-line bg-card p-5 lg:col-span-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl">Actividad</h2>
              <p className="flex gap-4 text-xs text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-moss" /> Recibidos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#1f6f8a]" /> Respuestas
                </span>
              </p>
            </div>
            {stats ? <ActivityChart days={stats.activity} /> : <div className="h-56" />}
          </article>
          <article className="rounded-3xl border border-line bg-card p-5 lg:col-span-2">
            <h2 className="font-display text-2xl">Temas</h2>
            <p className="mt-1 mb-4 text-sm text-ink-soft">Preguntas de las familias, sin contar los borrados.</p>
            {stats ? <TopicBars topics={stats.topics} /> : null}
          </article>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-5">
          <article className="rounded-3xl border border-line bg-card p-5 lg:col-span-2">
            <h2 className="font-display text-2xl">Idiomas</h2>
            <p className="mt-1 mb-4 text-sm text-ink-soft">Catalán, castellano e inglés.</p>
            {stats ? <LanguageMix languages={stats.languages} /> : null}
            {stats && stats.deletionRequests > 0 ? (
              <p className="mt-5 flex items-start gap-2 rounded-2xl bg-sand px-3 py-3 text-sm">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-moss-deep" />
                <span>
                  {stats.deletionRequests} solicitud{stats.deletionRequests === 1 ? '' : 'es'} de borrado. El
                  teléfono y el historial ya no están en el hilo.
                </span>
              </p>
            ) : null}
          </article>
          <article className="rounded-3xl border border-line bg-card p-5 lg:col-span-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">Últimas conversaciones</h2>
              <Link to="/conversaciones" className="text-sm font-medium text-moss-deep hover:underline">
                Ver todas
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {stats?.recent.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/conversaciones/${item.id}`}
                    className="flex items-start justify-between gap-4 py-3 hover:bg-paper/80"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{item.anonymized ? 'Usuario anonimizado' : item.phoneMasked}</span>
                        <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold">
                          {languageShort(item.language)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-soft">{item.topic}</span>
                      <span className="mt-1 block truncate text-sm">{item.preview}</span>
                    </span>
                    <time className="shrink-0 text-xs text-ink-soft" dateTime={item.at}>
                      {item.at ? formatListTime(item.at) : ''}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  small = false,
}: {
  icon: typeof MessagesSquare
  label: string
  value: string
  hint: string
  small?: boolean
}) {
  return (
    <article className="rounded-3xl border border-line bg-card px-4 py-4">
      <div className="flex items-center justify-between text-ink-soft">
        <p className="text-sm">{label}</p>
        <Icon className="h-4 w-4" />
      </div>
      <p className={small ? 'mt-3 text-xl leading-snug font-semibold' : 'mt-3 font-display text-4xl tracking-tight'}>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-soft">{hint}</p>
    </article>
  )
}
