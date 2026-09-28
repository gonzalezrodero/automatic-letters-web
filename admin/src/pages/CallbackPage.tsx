import { Link, useSearchParams } from 'react-router-dom'
import { cognitoRedirectUri } from '../auth/cognito'
import { Logo } from '../components/Logo'

export function CallbackPage() {
  const [params] = useSearchParams()
  const code = params.get('code')
  const error = params.get('error_description') ?? params.get('error')

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <Logo />
      <h1 className="mt-8 font-display text-4xl">Callback de Cognito</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        Esta ruta es el <code className="text-ink">redirect_uri</code> del Hosted UI (
        <span className="break-all">{cognitoRedirectUri()}</span>). El portal no intercambia el código:
        lo enviaría al backend para obtener los tokens y leer los grupos.
      </p>
      {code ? (
        <p className="mt-4 rounded-2xl bg-foam px-4 py-3 text-sm text-moss-deep">
          Hemos recibido un <code>code</code>. En producción <code>POST /auth/token</code> lo cambiaría por
          un access token. Aquí no se llama a Cognito.
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      {!code && !error ? (
        <p className="mt-4 rounded-2xl bg-sand px-4 py-3 text-sm">
          No hay <code>code</code> en la URL. Llegarás aquí después de que la persona autorice la aplicación.
        </p>
      ) : null}
      <Link to="/login" className="mt-8 inline-flex font-medium text-moss-deep hover:underline">
        Volver al acceso
      </Link>
    </div>
  )
}
