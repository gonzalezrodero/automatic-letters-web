import { endpoints } from './endpoints'
import { publicApiError } from './errors'
import { sessionFromGroups, type DisplaySession } from '../auth/groups'

export interface TokenExchange {
  session: DisplaySession
  /** Present only when the API returns a bearer token. Never a refresh token. */
  accessToken: string | null
}

interface TokenBody {
  email?: unknown
  name?: unknown
  groups?: unknown
  accessToken?: unknown
  refreshToken?: unknown
}

/**
 * Sends the authorization code to the API. The client secret stays on the server.
 * A refresh token in the JSON is ignored and not stored.
 * If accessToken is absent, the API is expected to have set an httpOnly cookie.
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
  } catch (error) {
    console.error('API error', error)
    throw new Error('No se ha podido contactar con el servidor.')
  }

  if (!response.ok) {
    throw publicApiError(response.status, await response.text())
  }

  const body = (await response.json()) as TokenBody
  if (typeof body.refreshToken === 'string') {
    console.error('API error', 'El API ha devuelto un refresh token. El navegador lo ignora.')
  }
  if (typeof body.email !== 'string' || !Array.isArray(body.groups)) {
    throw new Error('La respuesta de acceso no incluye el perfil.')
  }
  const groups = body.groups.filter((group): group is string => typeof group === 'string')
  const name = typeof body.name === 'string' && body.name.trim() ? body.name : body.email
  return {
    session: sessionFromGroups(body.email, name, groups),
    accessToken: typeof body.accessToken === 'string' && body.accessToken ? body.accessToken : null,
  }
}
