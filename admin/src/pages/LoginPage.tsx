import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { COGNITO_AUTHORIZE_TEMPLATE, cognitoAuthorizeUrl, cognitoRedirectUri } from '../auth/cognito'
import { useAuth } from '../auth/AuthContext'
import { Logo } from '../components/Logo'

export function LoginPage() {
  const { session, login, accounts } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('admin@core-webhook.eu')
  const [password, setPassword] = useState('demo')
  const [error, setError] = useState<string | null>(null)
  const [showCognito, setShowCognito] = useState(false)

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

  function onCognito() {
    const url = cognitoAuthorizeUrl()
    if (url) {
      window.location.assign(url)
      return
    }
    setShowCognito(true)
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
            Conversaciones, documentos del RAG y la personalidad del asistente. Un grupo de Cognito por tenant, y el grupo admin para cambiar de organización.
          </p>
        </div>
        <div className="max-w-sm rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-bot px-3 py-2 text-sm text-ink">
            Queden 7 places al grup d’iniciació. El campus és de 9:00 a 13:30.
            <p className="mt-1 text-right text-[11px] text-ink-soft">Bot · 09:14</p>
          </div>
          <p className="mt-3 text-xs text-white/45">Club Bàsquet Samà · vista de demostración</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-4xl">Entra al portal</h2>
          <p className="mt-2 text-ink-soft">
            Pantalla visual. En producción este formulario lo sustituye Cognito Hosted UI.
          </p>

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

          <div className="my-5 flex items-center gap-3 text-xs tracking-wide text-ink-soft uppercase">
            <span className="h-px flex-1 bg-line" />
            o
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={onCognito}
            className="w-full rounded-2xl border border-line bg-card py-3 font-semibold hover:border-moss"
          >
            Continuar con Cognito
          </button>

          {showCognito ? (
            <div className="mt-4 rounded-2xl border border-line bg-sand/60 p-4 text-sm leading-relaxed">
              <p className="font-medium">Aquí iría el Hosted UI</p>
              <p className="mt-2 text-ink-soft">
                Con <code className="text-ink">VITE_COGNITO_DOMAIN</code> y{' '}
                <code className="text-ink">VITE_COGNITO_CLIENT_ID</code>, este botón redirige a{' '}
                <code className="text-ink">/oauth2/authorize</code>. El callback previsto es{' '}
                <code className="break-all text-ink">{cognitoRedirectUri()}</code>. El API .NET
                intercambia el <code className="text-ink">code</code>; el grupo{' '}
                <code className="text-ink">admin</code> es superadmin y cada otro grupo es el id del tenant.
              </p>
              <p className="mt-3 break-all rounded-xl bg-card px-3 py-2 font-mono text-[11px] text-ink-soft">
                {COGNITO_AUTHORIZE_TEMPLATE}
              </p>
            </div>
          ) : null}

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
                      {account.role === 'superadmin' ? 'Superadmin' : 'Tenant'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-soft">Contraseña de todas: demo. No sale de este navegador.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
