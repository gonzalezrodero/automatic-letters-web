import { acceptedCognitoLogoutUrl } from '../auth/logoutUrl'
import { endpoints } from './endpoints'

/**
 * POST /auth/logout so the API clears ae_access and ae_id, then returns the
 * Hosted UI URL. The browser sends Origin itself. A missing or unsafe URL
 * yields null so the caller can fall back to the configured logout URL.
 */
export async function requestApiLogout(
  apiBase: string,
  cognitoHost: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const root = apiBase.replace(/\/$/, '')
  try {
    const response = await fetchImpl(`${root}${endpoints.logout}`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) {
      console.error('API error', response.status, (await response.text()).slice(0, 2000))
      return null
    }
    const body = (await response.json()) as { cognitoLogoutUrl?: unknown }
    return acceptedCognitoLogoutUrl(body.cognitoLogoutUrl, cognitoHost)
  } catch (error) {
    console.error('API error', error)
    return null
  }
}
