import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchSessionProfile } from '../api/session'
import { requestApiLogout } from '../api/logout'
import { clearCredential, setCookieSession } from './credentials'
import { cognitoHost, cognitoLogoutUrl } from './cognito'
import { sessionFromGroups, type DisplaySession, type Role } from './groups'
import { clearOAuthRequest } from './oauth'

export type { Role }

export type Session = DisplaySession

interface Account {
  email: string
  password: string
  name: string
  groups: string[]
}

const ACCOUNTS: Account[] = import.meta.env.DEV
  ? [
      {
        email: 'admin@example.com',
        password: 'demo',
        name: 'Admin',
        groups: ['admin'],
      },
    ]
  : []

const STORAGE_KEY = 'al.session'

interface AuthContextValue {
  session: Session | null
  ready: boolean
  accounts: Array<Account & { role: Role }>
  login: (email: string, password: string) => string | null
  acceptApiSession: (session: Session) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function apiBase(): string {
  return import.meta.env.VITE_API_BASE?.trim() ?? ''
}

function readDemoSession(): Session | null {
  if (apiBase()) return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { email?: unknown; name?: unknown; groups?: unknown; accessToken?: unknown }
    if (typeof parsed.email !== 'string' || typeof parsed.name !== 'string' || !Array.isArray(parsed.groups)) {
      return null
    }
    const groups = parsed.groups.filter((group): group is string => typeof group === 'string')
    const session = sessionFromGroups(parsed.email, parsed.name, groups)
    if ('accessToken' in parsed) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
    return session
  } catch {
    return null
  }
}

function persistDemoSession(session: Session): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

async function restoreCookieSession(base: string): Promise<Session | null> {
  const profile = await fetchSessionProfile(base)
  if (!profile) return null
  setCookieSession()
  return profile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const base = apiBase()
  const [session, setSession] = useState<Session | null>(() => readDemoSession())
  const [ready, setReady] = useState(!base)

  useEffect(() => {
    if (!base) return
    let cancel = false
    restoreCookieSession(base)
      .then((restored) => {
        if (!cancel && restored) setSession(restored)
      })
      .finally(() => {
        if (!cancel) setReady(true)
      })
    return () => {
      cancel = true
    }
  }, [base])

  const accounts = useMemo(
    () => ACCOUNTS.map((account) => ({ ...account, role: sessionFromGroups(account.email, account.name, account.groups).role })),
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      accounts,
      login(email, password) {
        if (base) return 'Con el API configurado el acceso es solo con Cognito.'
        if (!import.meta.env.DEV) return 'Este portal no tiene el API configurado.'
        const account = ACCOUNTS.find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
        if (!account) return 'No reconocemos esta cuenta de demostración.'
        if (account.password !== password) return 'Contraseña incorrecta. En la demo es «demo».'
        const next = sessionFromGroups(account.email, account.name, account.groups)
        persistDemoSession(next)
        setSession(next)
        return null
      },
      acceptApiSession(next) {
        setCookieSession()
        setSession(next)
      },
      logout() {
        const baseAtLogout = base
        clearCredential()
        clearOAuthRequest(sessionStorage)
        sessionStorage.removeItem(STORAGE_KEY)
        setSession(null)
        void (async () => {
          const fromApi = baseAtLogout ? await requestApiLogout(baseAtLogout, cognitoHost()) : null
          const url = fromApi ?? cognitoLogoutUrl()
          if (url) window.location.assign(url)
        })()
      },
    }),
    [accounts, base, ready, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth fuera de AuthProvider')
  return value
}
