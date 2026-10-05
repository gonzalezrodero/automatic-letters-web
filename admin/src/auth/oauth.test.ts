import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  consumeOAuthRequest,
  createCodeChallenge,
  rememberOAuthRequest,
  stripAuthParams,
  takeOAuthCallback,
  type OAuthStorage,
} from './oauth'

function memoryStorage(): OAuthStorage {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
}

describe('PKCE', () => {
  it('matches the S256 challenge of the verifier', async () => {
    const storage = memoryStorage()
    const { state, challenge } = await rememberOAuthRequest(storage)
    const verifier = consumeOAuthRequest(storage, state)
    expect(verifier).toBeTruthy()
    const digest = createHash('sha256').update(verifier!).digest()
    const expected = digest.toString('base64url')
    expect(await createCodeChallenge(verifier!)).toBe(expected)
    expect(challenge).toBe(expected)
  })

  it('rejects a mismatched state and clears the stored verifier', async () => {
    const storage = memoryStorage()
    await rememberOAuthRequest(storage)
    expect(consumeOAuthRequest(storage, 'other-state')).toBeNull()
    expect(consumeOAuthRequest(storage, 'other-state')).toBeNull()
  })
})

describe('authorize and logout urls', () => {
  it('includes state and PKCE on authorize, and logout_uri on logout', () => {
    const authorize = new URL(
      buildAuthorizeUrl({
        domain: 'auth.core-webhook.eu',
        clientId: 'abc',
        redirectUri: 'https://admin.core-webhook.eu/auth/callback',
        state: 'state-1',
        codeChallenge: 'challenge-1',
      }),
    )
    expect(authorize.searchParams.get('state')).toBe('state-1')
    expect(authorize.searchParams.get('code_challenge')).toBe('challenge-1')
    expect(authorize.searchParams.get('code_challenge_method')).toBe('S256')
    expect(authorize.searchParams.get('response_type')).toBe('code')

    const logout = new URL(
      buildLogoutUrl({
        domain: 'auth.core-webhook.eu',
        clientId: 'abc',
        logoutUri: 'https://admin.core-webhook.eu/login',
      }),
    )
    expect(logout.pathname).toBe('/logout')
    expect(logout.searchParams.get('logout_uri')).toBe('https://admin.core-webhook.eu/login')
    expect(logout.searchParams.get('client_id')).toBe('abc')
  })
})

describe('takeOAuthCallback', () => {
  it('strips the code from the url and returns the verifier', async () => {
    const storage = memoryStorage()
    const { state } = await rememberOAuthRequest(storage)
    let next = ''
    const result = takeOAuthCallback({
      href: `https://admin.core-webhook.eu/auth/callback?code=one-time&state=${state}`,
      storage,
      replaceUrl: (value) => {
        next = value
      },
    })
    expect(result).toMatchObject({ kind: 'code', code: 'one-time' })
    expect(next).toBe('/auth/callback')
    expect(stripAuthParams('https://admin.core-webhook.eu/auth/callback?code=abc&state=s&keep=1')).toBe(
      '/auth/callback?keep=1',
    )
  })
})
