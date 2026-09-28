import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createAdminApi } from '../api'
import type { AdminApi, TenantProfile } from '../api/types'
import { useAuth } from './AuthContext'

const TENANT_KEY = 'al.tenant'

interface AdminContextValue {
  api: AdminApi
  tenants: TenantProfile[]
  tenant: TenantProfile
  setTenantId: (tenantId: string) => void
  replaceTenant: (tenant: TenantProfile) => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth()
  const api = useMemo(() => createAdminApi(), [])
  const [tenants, setTenants] = useState<TenantProfile[] | null>(null)
  const [tenantId, setTenantIdState] = useState<string | null>(() => sessionStorage.getItem(TENANT_KEY))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    let cancel = false
    api
      .listTenants()
      .then((list) => {
        if (cancel) return
        // Display filter only. The API must already have dropped tenants this token cannot see.
        const visible =
          session.role === 'superadmin' ? list : list.filter((item) => item.id === session.tenantId)
        setTenants(visible)
        setError(null)
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : 'No se pudo cargar.')
      })
    return () => {
      cancel = true
    }
  }, [api, session])

  const activeId = session?.role === 'tenant' ? session.tenantId : tenantId
  const tenant = tenants?.find((item) => item.id === activeId) ?? tenants?.[0] ?? null

  const value = useMemo<AdminContextValue | null>(() => {
    if (!session || !tenant || !tenants) return null
    return {
      api,
      tenants,
      tenant,
      setTenantId(next) {
        if (session.role !== 'superadmin') return
        if (!tenants.some((item) => item.id === next)) return
        sessionStorage.setItem(TENANT_KEY, next)
        setTenantIdState(next)
      },
      replaceTenant(next) {
        setTenants((current) => current?.map((item) => (item.id === next.id ? next : item)) ?? current)
      },
    }
  }, [api, session, tenant, tenants])

  if (!session) return null

  if (error) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div className="max-w-sm">
          <p className="text-ink-soft">{error}</p>
          <button type="button" onClick={logout} className="mt-4 text-sm font-medium text-moss-deep underline">
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  if (tenants === null) {
    return (
      <div className="grid h-full place-items-center">
        <p className="text-sm text-ink-soft">Cargando la organización…</p>
      </div>
    )
  }

  if (!value) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-3xl">Sin acceso a una organización</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Esta cuenta no tiene un tenant asignado. El grupo <code className="text-ink">admin</code> ve todas
            las organizaciones; cualquier otro grupo tiene que llamarse como el id del tenant, por ejemplo{' '}
            <code className="text-ink">club-basquet-sama</code>.
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-6 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin(): AdminContextValue {
  const value = useContext(AdminContext)
  if (!value) throw new Error('useAdmin fuera de AdminProvider')
  return value
}
