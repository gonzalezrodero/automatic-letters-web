export interface OAuthStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const OAUTH_STATE_KEY = 'al.oauth.state'
export const OAUTH_VERIFIER_KEY = 'al.oauth.verifier'

const STATE_BYTES = 32
const VERIFIER_BYTES = 32

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

export function randomUrlSafe(byteLength: number): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

export async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64UrlEncode(new Uint8Array(digest))
}

export async function rememberOAuthRequest(storage: OAuthStorage): Promise<{ state: string; challenge: string }> {
  const state = randomUrlSafe(STATE_BYTES)
  const verifier = randomUrlSafe(VERIFIER_BYTES)
  const challenge = await createCodeChallenge(verifier)
  storage.setItem(OAUTH_STATE_KEY, state)
  storage.setItem(OAUTH_VERIFIER_KEY, verifier)
  return { state, challenge }
}

/** Returns the PKCE verifier when state matches. Always clears the stored pair. */
export function consumeOAuthRequest(storage: OAuthStorage, state: string | null): string | null {
  const expected = storage.getItem(OAUTH_STATE_KEY)
  const verifier = storage.getItem(OAUTH_VERIFIER_KEY)
  storage.removeItem(OAUTH_STATE_KEY)
  storage.removeItem(OAUTH_VERIFIER_KEY)
  if (!state || !expected || !verifier || state !== expected) return null
  return verifier
}

export function clearOAuthRequest(storage: OAuthStorage): void {
  storage.removeItem(OAUTH_STATE_KEY)
  storage.removeItem(OAUTH_VERIFIER_KEY)
}

export function buildAuthorizeUrl(input: {
  domain: string
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
}): string {
  const url = new URL(`https://${input.domain}/oauth2/authorize`)
  url.searchParams.set('client_id', input.clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('redirect_uri', input.redirectUri)
  url.searchParams.set('state', input.state)
  url.searchParams.set('code_challenge', input.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  return url.toString()
}

export function buildLogoutUrl(input: { domain: string; clientId: string; logoutUri: string }): string {
  const url = new URL(`https://${input.domain}/logout`)
  url.searchParams.set('client_id', input.clientId)
  url.searchParams.set('logout_uri', input.logoutUri)
  return url.toString()
}

export function stripAuthParams(href: string): string {
  const url = new URL(href)
  for (const key of ['code', 'state', 'error', 'error_description']) {
    url.searchParams.delete(key)
  }
  const search = url.searchParams.toString()
  return `${url.pathname}${search ? `?${search}` : ''}${url.hash}`
}

export type OAuthCallback =
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | { kind: 'code'; code: string; verifier: string }

export function takeOAuthCallback(input: {
  href: string
  storage: OAuthStorage
  replaceUrl: (next: string) => void
}): OAuthCallback {
  const url = new URL(input.href)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error_description') ?? url.searchParams.get('error')
  input.replaceUrl(stripAuthParams(input.href))

  if (oauthError) {
    console.error('Cognito error', oauthError)
    clearOAuthRequest(input.storage)
    return { kind: 'error', message: 'Cognito no ha completado el acceso.' }
  }
  if (!code) {
    return { kind: 'empty' }
  }
  const verifier = consumeOAuthRequest(input.storage, state)
  if (!verifier) {
    return { kind: 'error', message: 'La respuesta de Cognito no coincide con esta pestaña. Vuelve a entrar.' }
  }
  return { kind: 'code', code, verifier }
}

let capturedCallback: OAuthCallback | null = null

/** Idempotent for React Strict Mode: the code is stripped once, before paint. */
export function takeOAuthCallbackFromWindow(): OAuthCallback {
  if (capturedCallback) return capturedCallback
  capturedCallback = takeOAuthCallback({
    href: window.location.href,
    storage: sessionStorage,
    replaceUrl: (next) => window.history.replaceState({}, '', next),
  })
  return capturedCallback
}
