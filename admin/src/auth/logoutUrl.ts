/**
 * The BFF returns the Cognito logout URL. Accept it only when it is https on the
 * configured Hosted UI host and the path is /logout, so a bad response cannot
 * send the browser somewhere else.
 */
export function acceptedCognitoLogoutUrl(value: unknown, cognitoHost: string | null): string | null {
  if (typeof value !== 'string' || !cognitoHost) return null
  const host = cognitoHost.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]?.toLowerCase()
  if (!host) return null
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }
  if (url.username || url.password) return null
  if (url.protocol !== 'https:') return null
  if (url.hostname.toLowerCase() !== host) return null
  if (url.pathname !== '/logout') return null
  return url.toString()
}
