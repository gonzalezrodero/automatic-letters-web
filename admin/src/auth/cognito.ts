/**
 * Cognito Hosted UI plug-in.
 *
 * Production login should not collect a password here. Redirect the browser to
 * the hosted authorize endpoint and, on `/auth/callback`, send `code` to the
 * .NET API so it can exchange it for tokens (the client secret stays on the server).
 *
 * Cognito groups:
 * - `admin` → super-admin, can switch tenants
 * - any other group name → tenant id (TenantProfile.Id), e.g. `club-basquet-sama`
 *
 * Set VITE_COGNITO_DOMAIN and VITE_COGNITO_CLIENT_ID to turn the login button
 * into a real redirect. Until then the UI only shows this contract.
 */
export function cognitoAuthorizeUrl(): string | null {
  const domain = import.meta.env.VITE_COGNITO_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID
  if (!domain || !clientId) return null

  const redirect =
    import.meta.env.VITE_COGNITO_REDIRECT_URI ??
    `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`

  const url = new URL(`https://${domain}/oauth2/authorize`)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('redirect_uri', redirect)
  return url.toString()
}

export function cognitoRedirectUri(): string {
  return (
    import.meta.env.VITE_COGNITO_REDIRECT_URI ??
    `${typeof window === 'undefined' ? '' : window.location.origin}${import.meta.env.BASE_URL}auth/callback`
  )
}

export const COGNITO_AUTHORIZE_TEMPLATE = [
  'https://auth.core-webhook.eu/oauth2/authorize',
  '?client_id=ADMIN_CLIENT_ID',
  '&response_type=code',
  '&scope=openid%20email%20profile',
  '&redirect_uri=https://www.core-webhook.eu/admin/auth/callback',
].join('')
