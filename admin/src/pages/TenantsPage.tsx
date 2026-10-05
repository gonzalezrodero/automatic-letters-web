import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isUnavailable } from '../api/errors'
import type { DashboardStats, TenantProfile } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useAdmin } from '../auth/AdminContext'
import { cn } from '../lib/format'
import { tenantPlaceLine, tenantTitle } from '../lib/tenantLabel'

interface Row {
  tenant: TenantProfile
  stats: DashboardStats | null
}

export function TenantsPage() {
  const { session } = useAuth()
  const { api, tenants, tenant, setTenantId } = useAdmin()
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [metricsMissing, setMetricsMissing] = useState(false)

  useEffect(() => {
    if (session?.role !== 'superadmin') return
    let cancel = false
    setRows(null)
    Promise.all(
      tenants.map(async (item) => {
        try {
          return { tenant: item, stats: await api.getDashboard(item.id) }
        } catch (reason) {
          if (isUnavailable(reason)) return { tenant: item, stats: null }
          throw reason
        }
      }),
    )
      .then((next) => {
        if (cancel) return
        setRows(next)
        setMetricsMissing(next.length > 0 && next.every((row) => row.stats === null))
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : 'No se pudieron comparar.')
      })
    return () => {
      cancel = true
    }
  }, [api, session?.role, tenants])

  if (session?.role !== 'superadmin') return <Navigate to="/" replace />

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
        <h1 className="font-display text-4xl">Organizaciones</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Vista de superadmin. Cada tarjeta es un tenant con su grupo de Cognito. Entrar cambia el portal entero a
          esa organización.
        </p>
        {metricsMissing ? (
          <p className="mt-4 text-sm text-ink-soft">El resumen de cada organización todavía no está en el API.</p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(rows ?? tenants.map((item) => ({ tenant: item, stats: null as DashboardStats | null }))).map((row) => {
            const current = row.tenant.id === tenant.id
            return (
              <article
                key={row.tenant.id}
                className={cn(
                  'flex flex-col rounded-3xl border bg-card p-5',
                  current ? 'border-moss ring-2 ring-moss/30' : 'border-line',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl">{tenantTitle(row.tenant)}</h2>
                    {tenantPlaceLine(row.tenant) ? (
                      <p className="text-sm text-ink-soft">{tenantPlaceLine(row.tenant)}</p>
                    ) : null}
                  </div>
                  {current ? (
                    <span className="rounded-full bg-foam px-2.5 py-1 text-xs font-medium text-moss-deep">
                      En pantalla
                    </span>
                  ) : null}
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Metric label="Hilos" value={metric(row.stats?.conversationCount, metricsMissing || rows !== null)} />
                  <Metric label="Mensajes" value={metric(row.stats?.messagesThisWeek, metricsMissing || rows !== null)} />
                  <Metric label="Activos" value={metric(row.stats?.activeUsers, metricsMissing || rows !== null)} />
                </dl>
                <p className="mt-4 text-xs text-ink-soft">
                  Grupo Cognito <code className="text-ink">{row.tenant.id}</code>
                  <br />
                  WhatsApp phone number id {row.tenant.botPhoneNumberId}
                </p>
                <button
                  type="button"
                  className="mt-5 rounded-2xl bg-ink py-3 text-sm font-semibold text-white"
                  onClick={() => {
                    setTenantId(row.tenant.id)
                    navigate('/')
                  }}
                >
                  Abrir el panel
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function metric(value: number | undefined, settled: boolean): string {
  if (typeof value === 'number') return String(value)
  return settled ? '—' : '…'
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper px-2 py-3">
      <dt className="text-[11px] tracking-wide text-ink-soft uppercase">{label}</dt>
      <dd className="mt-1 font-display text-2xl">{value}</dd>
    </div>
  )
}
