import { buildAuthorizeUrl, buildLogoutUrl, rememberOAuthRequest } from './oauth'

/**
 * Cognito Hosted UI.
 *
 * The browser redirects with state and PKCE (S256). On /auth/callback the code
 * is checked against the state stored for this tab and posted to the API
 * (`POST /auth/token`) with the code verifier. The client secret never ships here.
 *
 * Groups, for display only:
 * - `admin` wins and opens the superadmin view even if a tenant group is also present
 * - any other group name is a tenant id, for example `example-tenant`
 *
 * The API must enforce that. See the README.
 */
/** Host only, no scheme. Authorize and logout URLs are built as https://<host>/... */
export function cognitoHost(): string | null {
  const domain = import.meta.env.VITE_COGNITO_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return domain || null
}

function cognitoClientId(): string | null {
  return import.meta.env.VITE_COGNITO_CLIENT_ID || null
}

export function cognitoRedirectUri(): string {
  return (
    import.meta.env.VITE_COGNITO_REDIRECT_URI ??
    `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`
  )
}

export function cognitoLogoutUri(): string {
  return (
    import.meta.env.VITE_COGNITO_LOGOUT_URI ??
    `${window.location.origin}${import.meta.env.BASE_URL}login`
  )
}

export function cognitoConfigured(): boolean {
  return Boolean(cognitoHost() && cognitoClientId())
}

/** Stores state and the PKCE verifier in sessionStorage, then returns the authorize URL. */
export async function startCognitoLogin(): Promise<string | null> {
  const domain = cognitoHost()
  const clientId = cognitoClientId()
  if (!domain || !clientId) return null
  const { state, challenge } = await rememberOAuthRequest(sessionStorage)
  return buildAuthorizeUrl({
    domain,
    clientId,
    redirectUri: cognitoRedirectUri(),
    state,
    codeChallenge: challenge,
  })
}

export function cognitoLogoutUrl(): string | null {
  const domain = cognitoHost()
  const clientId = cognitoClientId()
  if (!domain || !clientId) return null
  return buildLogoutUrl({ domain, clientId, logoutUri: cognitoLogoutUri() })
}
