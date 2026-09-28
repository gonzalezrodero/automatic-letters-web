/**
 * Tab memory only. Access tokens are never written to localStorage or sessionStorage.
 * A cookie session means the API set an httpOnly cookie; this module only remembers
 * that the cookie was confirmed, not the cookie value.
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
