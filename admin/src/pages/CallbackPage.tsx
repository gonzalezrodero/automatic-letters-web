import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { cognitoRedirectUri } from '../auth/cognito'
import { takeOAuthCallbackFromWindow, type OAuthCallback } from '../auth/oauth'
import { fetchSessionProfile } from '../api/session'
import { exchangeAuthorizationCode } from '../api/token'
import { Logo } from '../components/Logo'

const exchanges = new Map<string, Promise<void>>()

export function CallbackPage() {
  const { acceptApiSession } = useAuth()
  const navigate = useNavigate()
  const [pending] = useState<OAuthCallback>(() => takeOAuthCallbackFromWindow())
  const [error, setError] = useState<string | null>(pending.kind === 'error' ? pending.message : null)

  useEffect(() => {
    if (pending.kind !== 'code') return
    const apiBase = import.meta.env.VITE_API_BASE?.trim()
    if (!apiBase) {
      setError('Falta VITE_API_BASE. El código se canjea en el API, no en el navegador.')
      return
    }

    let cancel = false
    const existing = exchanges.get(pending.code)
    const job =
      existing ??
      exchangeAuthorizationCode({
        apiBase,
        code: pending.code,
        codeVerifier: pending.verifier,
        redirectUri: cognitoRedirectUri(),
      }).then(async (result) => {
        const profile = await fetchSessionProfile(apiBase)
        acceptApiSession(profile ?? result.session)
      })
    if (!existing) exchanges.set(pending.code, job)

    job
      .then(() => {
        if (!cancel) navigate('/', { replace: true })
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : 'No se pudo completar el acceso.')
      })

    return () => {
      cancel = true
    }
  }, [acceptApiSession, navigate, pending])

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <Logo />
      <h1 className="mt-8 font-display text-4xl">Callback de Cognito</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        Esta ruta es el <code className="text-ink">redirect_uri</code> ({cognitoRedirectUri()}). El código se
        comprueba con el state de esta pestaña y se envía a <code className="text-ink">POST /auth/token</code>.
      </p>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      {pending.kind === 'code' && !error ? (
        <p className="mt-4 rounded-2xl bg-foam px-4 py-3 text-sm text-moss-deep">Completando el acceso…</p>
      ) : null}
      {pending.kind === 'empty' && !error ? (
        <p className="mt-4 rounded-2xl bg-sand px-4 py-3 text-sm">
          No hay un código de autorización en esta visita.
        </p>
      ) : null}
      <Link to="/login" className="mt-8 inline-flex font-medium text-moss-deep hover:underline">
        Volver al acceso
      </Link>
    </div>
  )
}
