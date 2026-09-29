import { sessionFromGroups, type DisplaySession } from '../auth/groups'
import { endpoints } from './endpoints'

interface ProfileBody {
  email?: unknown
  name?: unknown
  groups?: unknown
}

/** GET /me with the httpOnly cookie. Returns null when the cookie is absent or the call fails. */
export async function fetchSessionProfile(
  apiBase: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DisplaySession | null> {
  const root = apiBase.replace(/\/$/, '')
  try {
    const response = await fetchImpl(`${root}${endpoints.me}`, {
      credentials: 'include',
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      console.error('API error', response.status, (await response.text()).slice(0, 2000))
      return null
    }
    const body = (await response.json()) as ProfileBody
    return profileFromBody(body)
  } catch (error) {
    console.error('API error', error)
    return null
  }
}

export function profileFromBody(body: ProfileBody): DisplaySession | null {
  if (typeof body.email !== 'string' || !Array.isArray(body.groups)) return null
  const groups = body.groups.filter((group): group is string => typeof group === 'string')
  const name = typeof body.name === 'string' && body.name.trim() ? body.name : body.email
  return sessionFromGroups(body.email, name, groups)
}
