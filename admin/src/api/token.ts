import { endpoints } from './endpoints'
import { publicApiError } from './errors'
import { sessionFromGroups, type DisplaySession } from '../auth/groups'

export interface TokenExchange {
  session: DisplaySession
}

interface TokenBody {
  email?: unknown
  name?: unknown
  groups?: unknown
}

/**
 * Sends the authorization code to the API. The client secret stays on the server.
 * The development BFF sets httpOnly cookies and returns { email, name, groups }.
 * Access and refresh tokens in the JSON are ignored and never stored. Sending
 * Authorization later would hide the ae_access cookie, so the session is the cookie.
 */
export async function exchangeAuthorizationCode(input: {
  apiBase: string
  code: string
  codeVerifier: string
  redirectUri: string
  fetchImpl?: typeof fetch
}): Promise<TokenExchange> {
  const fetchImpl = input.fetchImpl ?? fetch
  const root = input.apiBase.replace(/\/$/, '')
  let response: Response
  try {
    response = await fetchImpl(`${root}${endpoints.token}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: input.code,
        codeVerifier: input.codeVerifier,
        redirectUri: input.redirectUri,
      }),
    })
  } catch {
    console.error('access')
    throw new Error('No hemos podido conectar. Comprueba tu conexión y vuelve a intentarlo.')
  }

  if (!response.ok) {
    throw publicApiError(response.status)
  }

  const body = (await response.json()) as TokenBody
  if (typeof body.email !== 'string' || !Array.isArray(body.groups)) {
    throw new Error('No hemos podido iniciar tu sesión. Vuelve a entrar desde la pantalla de acceso.')
  }
  const groups = body.groups.filter((group): group is string => typeof group === 'string')
  const name = typeof body.name === 'string' && body.name.trim() ? body.name : body.email
  return {
    session: sessionFromGroups(body.email, name, groups),
  }
}
