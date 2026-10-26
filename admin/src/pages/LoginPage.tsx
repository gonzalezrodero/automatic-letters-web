import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { cognitoConfigured, cognitoLogoutUrl, startCognitoLogin } from '../auth/cognito'
import { decideCognitoResume, markCognitoRelogin } from '../auth/oauth'
import { safeInternalPath } from '../lib/safeUrl'
import { apiConfigured } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Logo } from '../components/Logo'

export function LoginPage() {
  const usingApi = apiConfigured()
  const showDemoForm = import.meta.env.DEV && !usingApi
  const { session, ready, login, accounts } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = safeInternalPath((location.state as { from?: unknown } | null)?.from)
  const [email, setEmail] = useState(showDemoForm ? 'admin@example.com' : '')
  const [password, setPassword] = useState(showDemoForm ? 'demo' : '')
  const [error, setError] = useState<string | null>(null)
  const [showCognito, setShowCognito] = useState(false)
  const [restarting, setRestarting] = useState(false)

  useEffect(() => {
    const decision = decideCognitoResume({
      storage: sessionStorage,
      ready,
      signedIn: session != null,
      cognitoConfigured: cognitoConfigured(),
      apiBase: import.meta.env.VITE_API_BASE?.trim() ?? '',
    })
    if (decision === 'skip') return
    if (decision === 'unconfigured') {
      setShowCognito(true)
      return
    }
    setRestarting(true)
    void (async () => {
      try {
        const url = await startCognitoLogin()
        if (!url) {
          setRestarting(false)
          setShowCognito(true)
          return
        }
        window.location.assign(url)
      } catch {
        setRestarting(false)
        setError('No hemos podido iniciar tu sesión. Vuelve a entrar desde la pantalla de acceso.')
      }
    })()
  }, [ready, session])

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper">
        <p className="text-sm text-ink-soft">Comprobando la sesión…</p>
      </div>
    )
  }

  if (session) return <Navigate to={from} replace />

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const message = login(email, password)
    if (message) {
      setError(message)
      return
    }
    navigate(from, { replace: true })
  }

  async function onCognito() {
    const logout = cognitoLogoutUrl()
    if (logout) {
      markCognitoRelogin(sessionStorage)
      window.location.assign(logout)
      return
    }
    try {
      const url = await startCognitoLogin()
      if (!url) {
        setShowCognito(true)
        return
      }
      window.location.assign(url)
    } catch {
      setError('No hemos podido iniciar tu sesión. Vuelve a entrar desde la pantalla de acceso.')
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <Logo light />
        <div className="max-w-md">
          <p className="text-sm tracking-[0.18em] text-white/50 uppercase">WhatsApp · por organización</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05]">
            El bot de cada club, visto desde dentro.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            Conversaciones, documentos y la forma de hablar del asistente. Puedes cambiar de
            organización si tu cuenta lo permite.
          </p>
        </div>
        <div className="max-w-sm rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-bot px-3 py-2 text-sm text-ink">
            El bot responde con lo que hay en los documentos de la organización.
            <p className="mt-1 text-right text-[11px] text-ink-soft">Bot · 09:14</p>
          </div>
          <p className="mt-3 text-xs text-white/45">Vista de demostración</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-4xl">Entra al portal</h2>
          <p className="mt-2 text-ink-soft">
            {usingApi
              ? 'Entra con tu cuenta.'
              : 'Esto es una prueba. En el portal real entrarás con tu cuenta.'}
          </p>

          {showDemoForm ? (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Correo</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-moss"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Contraseña</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-moss"
                required
              />
            </label>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <button
              type="submit"
              className="w-full rounded-2xl bg-moss py-3 font-semibold text-white hover:bg-moss-deep"
            >
              Entrar
            </button>
          </form>
          ) : null}

          {usingApi && error ? <p className="mt-6 text-sm text-danger">{error}</p> : null}

          {showDemoForm ? (
          <div className="my-5 flex items-center gap-3 text-xs tracking-wide text-ink-soft uppercase">
            <span className="h-px flex-1 bg-line" />
            o
            <span className="h-px flex-1 bg-line" />
          </div>
          ) : null}

          <button
            type="button"
            onClick={onCognito}
            disabled={restarting}
            className={`${usingApi ? 'mt-8 ' : ''}w-full rounded-2xl border border-line bg-card py-3 font-semibold hover:border-moss disabled:opacity-60`}
          >
            {restarting ? 'Un momento…' : 'Entrar con mi cuenta'}
          </button>

          {showCognito ? (
            <p className="mt-4 rounded-2xl border border-line bg-sand/60 p-4 text-sm leading-relaxed text-ink-soft">
              El acceso no está disponible ahora mismo. Vuelve a intentarlo más tarde.
            </p>
          ) : null}

          {showDemoForm ? (
          <div className="mt-8">
            <p className="text-xs tracking-[0.14em] text-ink-soft uppercase">Cuentas de demostración</p>
            <ul className="mt-3 space-y-2">
              {accounts.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(account.email)
                      setPassword(account.password)
                      setError(null)
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-left hover:border-moss"
                  >
                    <span>
                      <span className="block text-sm font-medium">{account.name}</span>
                      <span className="block text-xs text-ink-soft">{account.email}</span>
                    </span>
                    <span className="text-xs font-medium text-moss-deep">
                      {account.role === 'superadmin' ? 'Administración' : 'Organización'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-soft">Contraseña de todas: demo. No sale de este navegador.</p>
          </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
