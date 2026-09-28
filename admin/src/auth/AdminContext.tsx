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
  const { session } = useAuth()
  const api = useMemo(
    () => createAdminApi(() => session?.accessToken ?? null),
    [session?.accessToken],
  )
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
        const visible =
          session.role === 'superadmin'
            ? list
            : list.filter((item) => item.id === session.tenantId)
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
        <p className="max-w-sm text-ink-soft">{error}</p>
      </div>
    )
  }

  if (!value) {
    return (
      <div className="grid h-full place-items-center">
        <p className="text-sm text-ink-soft">Cargando la organización…</p>
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
