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
      <section className="relative hidden overflow-hidden bg-moss text-paper lg:flex lg:flex-col lg:gap-16 lg:px-14 lg:py-12">
        <Logo light />
        <div className="max-w-md">
          <p className="font-display text-4xl leading-tight font-bold">
            Las conversaciones y los documentos de tu negocio.
          </p>
          <p className="mt-5 text-lg leading-relaxed">
            Entras, ves lo que han preguntado y lo que el asistente ha contestado.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-4xl font-bold">Entra al portal</h1>
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
                className="w-full rounded-md border border-line bg-card px-4 py-3 outline-none focus:border-moss"
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
                className="w-full rounded-md border border-line bg-card px-4 py-3 outline-none focus:border-moss"
                required
              />
            </label>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <button
              type="submit"
              className="btn-accent w-full rounded-md py-3"
            >
              Entrar
            </button>
          </form>
          ) : null}

          {usingApi && error ? <p className="mt-6 text-sm text-danger">{error}</p> : null}

          {showDemoForm ? (
          <div className="my-5 flex items-center gap-3 text-sm text-ink-soft">
            <span className="h-px flex-1 bg-line" />
            o
            <span className="h-px flex-1 bg-line" />
          </div>
          ) : null}

          <button
            type="button"
            onClick={onCognito}
            disabled={restarting}
            className={
              showDemoForm
                ? 'w-full rounded-md border border-line bg-card py-3 font-semibold hover:border-moss disabled:opacity-60'
                : 'btn-accent mt-8 w-full rounded-md py-3 disabled:opacity-60'
            }
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
            <p className="text-sm font-bold text-ink">Cuentas de demostración</p>
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
                    className="flex w-full items-center justify-between rounded-md border border-line bg-card px-4 py-3 text-left hover:border-moss"
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
            <p className="mt-3 text-sm text-ink-soft">Contraseña de todas: demo. No sale de este navegador.</p>
          </div>
          ) : null}
          <p className="mt-8 text-sm">
            <a className="font-bold text-moss-deep underline" href="https://www.core-webhook.eu/">
              Volver a la página principal
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}
