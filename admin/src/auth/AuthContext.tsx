import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Role = 'superadmin' | 'tenant'

export interface Session {
  email: string
  name: string
  role: Role
  tenantId: string | null
  groups: string[]
  accessToken: string | null
}

interface Account {
  email: string
  password: string
  name: string
  role: Role
  tenantId: string | null
  groups: string[]
}

const ACCOUNTS: Account[] = [
  {
    email: 'admin@core-webhook.eu',
    password: 'demo',
    name: 'Daniel González',
    role: 'superadmin',
    tenantId: null,
    groups: ['admin'],
  },
  {
    email: 'campus@cbsama.cat',
    password: 'demo',
    name: 'Núria Solé',
    role: 'tenant',
    tenantId: 'club-basquet-sama',
    groups: ['club-basquet-sama'],
  },
  {
    email: 'secretaria@harmonia.cat',
    password: 'demo',
    name: 'Marc Puig',
    role: 'tenant',
    tenantId: 'escola-harmonia',
    groups: ['escola-harmonia'],
  },
]

const STORAGE_KEY = 'al.session'

interface AuthContextValue {
  session: Session | null
  accounts: Account[]
  login: (email: string, password: string) => string | null
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      accounts: ACCOUNTS,
      login(email, password) {
        const account = ACCOUNTS.find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
        if (!account) return 'No reconocemos esta cuenta de demostración.'
        if (account.password !== password) return 'Contraseña incorrecta. En la demo es «demo».'
        const next: Session = {
          email: account.email,
          name: account.name,
          role: account.role,
          tenantId: account.tenantId,
          groups: account.groups,
          accessToken: null,
        }
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        setSession(next)
        return null
      },
      logout() {
        sessionStorage.removeItem(STORAGE_KEY)
        setSession(null)
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth fuera de AuthProvider')
  return value
}
