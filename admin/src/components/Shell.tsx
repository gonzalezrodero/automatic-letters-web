import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  ChevronDown,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessagesSquare,
  Settings,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useAdmin } from '../auth/AdminContext'
import { cn, initials } from '../lib/format'
import { Logo } from './Logo'

const links = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/conversaciones', label: 'Conversaciones', icon: MessagesSquare, end: false },
  { to: '/conocimiento', label: 'Conocimiento', icon: Library, end: false },
  { to: '/ajustes', label: 'Ajustes del bot', icon: Settings, end: false },
]

export function Shell() {
  const { session, logout } = useAuth()
  const { tenant, tenants, setTenantId } = useAdmin()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const superadmin = session?.role === 'superadmin'
  const previousTenant = useRef(tenant.id)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (previousTenant.current === tenant.id) return
    previousTenant.current = tenant.id
    if (location.pathname.startsWith('/conversaciones/')) {
      navigate('/conversaciones')
    }
  }, [tenant.id, location.pathname, navigate])

  return (
    <div className="flex h-dvh overflow-hidden bg-paper text-ink">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-ink text-white transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo light />
          <button type="button" className="rounded-lg p-1 text-white/70 lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3" aria-label="Secciones">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white',
                  isActive && 'bg-white/15 text-white',
                )
              }
            >
              <link.icon className="h-[18px] w-[18px]" />
              {link.label}
            </NavLink>
          ))}
          {superadmin ? (
            <NavLink
              to="/organizaciones"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white',
                  isActive && 'bg-white/15 text-white',
                )
              }
            >
              <Building2 className="h-[18px] w-[18px]" />
              Organizaciones
            </NavLink>
          ) : null}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xs font-semibold">
              {initials(session?.name ?? '')}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{session?.name}</p>
              <p className="truncate text-xs text-white/55">
                {superadmin ? 'Superadmin' : tenant.shortName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-card/80 px-3 backdrop-blur sm:px-5">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-line lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg leading-tight">{tenant.name}</p>
            <p className="truncate text-xs text-ink-soft">
              {tenant.city} · {tenant.kind}
            </p>
          </div>
          {superadmin ? (
            <label className="relative hidden sm:block">
              <span className="sr-only">Cambiar de organización</span>
              <select
                value={tenant.id}
                onChange={(event) => setTenantId(event.target.value)}
                className="appearance-none rounded-full border border-line bg-paper py-2 pr-9 pl-3 text-sm font-medium outline-none focus:border-moss"
              >
                {tenants.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.shortName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            </label>
          ) : (
            <span className="hidden rounded-full bg-foam px-3 py-1 text-xs font-medium text-moss-deep sm:inline">
              {tenant.shortName}
            </span>
          )}
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
