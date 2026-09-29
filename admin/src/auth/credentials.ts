/**
 * Tab memory only. Access tokens are never written to localStorage or sessionStorage.
 * The development BFF session is the httpOnly cookie. This module remembers that
 * the cookie was confirmed, not the cookie value.
 * setBearerToken remains for a caller that has no cookie. The Cognito callback
 * does not use it: an Authorization header would make the API ignore ae_access.
 */
export type ApiCredential = { kind: 'bearer'; accessToken: string } | { kind: 'cookie' }

let credential: ApiCredential | null = null

export function getCredential(): ApiCredential | null {
  return credential
}

export function setBearerToken(accessToken: string): void {
  credential = { kind: 'bearer', accessToken }
}

export function setCookieSession(): void {
  credential = { kind: 'cookie' }
}

export function clearCredential(): void {
  credential = null
}
