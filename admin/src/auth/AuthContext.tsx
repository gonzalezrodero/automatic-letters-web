import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearCredential, setBearerToken, setCookieSession } from './credentials'
import { cognitoLogoutUrl } from './cognito'
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

const ACCOUNTS: Account[] = [
  {
    email: 'admin@core-webhook.eu',
    password: 'demo',
    name: 'Daniel González',
    groups: ['admin'],
  },
  {
    email: 'campus@cbsama.cat',
    password: 'demo',
    name: 'Núria Solé',
    groups: ['club-basquet-sama'],
  },
  {
    email: 'secretaria@harmonia.cat',
    password: 'demo',
    name: 'Marc Puig',
    groups: ['escola-harmonia'],
  },
]

const STORAGE_KEY = 'al.session'

interface AuthContextValue {
  session: Session | null
  ready: boolean
  accounts: Array<Account & { role: Role }>
  login: (email: string, password: string) => string | null
  acceptApiSession: (session: Session, accessToken: string | null) => void
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
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/me`, {
      credentials: 'include',
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      console.error('API error', response.status, (await response.text()).slice(0, 2000))
      return null
    }
    const body = (await response.json()) as { email?: unknown; name?: unknown; groups?: unknown }
    if (typeof body.email !== 'string' || !Array.isArray(body.groups)) return null
    const groups = body.groups.filter((group): group is string => typeof group === 'string')
    const name = typeof body.name === 'string' && body.name.trim() ? body.name : body.email
    setCookieSession()
    return sessionFromGroups(body.email, name, groups)
  } catch (error) {
    console.error('API error', error)
    return null
  }
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
        const account = ACCOUNTS.find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
        if (!account) return 'No reconocemos esta cuenta de demostración.'
        if (account.password !== password) return 'Contraseña incorrecta. En la demo es «demo».'
        const next = sessionFromGroups(account.email, account.name, account.groups)
        persistDemoSession(next)
        setSession(next)
        return null
      },
      acceptApiSession(next, accessToken) {
        if (accessToken) setBearerToken(accessToken)
        else setCookieSession()
        setSession(next)
      },
      logout() {
        clearCredential()
        clearOAuthRequest(sessionStorage)
        sessionStorage.removeItem(STORAGE_KEY)
        setSession(null)
        const url = cognitoLogoutUrl()
        if (url) window.location.assign(url)
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
