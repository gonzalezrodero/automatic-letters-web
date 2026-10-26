import { describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  consumeOAuthRequest,
  createCodeChallenge,
  decideCognitoResume,
  markCognitoRelogin,
  rememberOAuthRequest,
  takeCognitoRelogin,
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

describe('cognito relogin', () => {
  it('remembers one fresh login and then forgets it', () => {
    const storage = memoryStorage()
    expect(takeCognitoRelogin(storage)).toBe(false)
    markCognitoRelogin(storage)
    expect(takeCognitoRelogin(storage)).toBe(true)
    expect(takeCognitoRelogin(storage)).toBe(false)
  })

  it('consumes the flag and resumes when Cognito is configured, including an empty API base', () => {
    const storage = memoryStorage()
    markCognitoRelogin(storage)
    expect(
      decideCognitoResume({
        storage,
        ready: true,
        signedIn: false,
        cognitoConfigured: true,
        apiBase: '',
      }),
    ).toBe('resume')
    expect(takeCognitoRelogin(storage)).toBe(false)

    const withApi = memoryStorage()
    markCognitoRelogin(withApi)
    expect(
      decideCognitoResume({
        storage: withApi,
        ready: true,
        signedIn: false,
        cognitoConfigured: true,
        apiBase: 'https://api.example',
      }),
    ).toBe('resume')
  })

  it('does not resume before the page is ready, and keeps the flag', () => {
    const storage = memoryStorage()
    markCognitoRelogin(storage)
    expect(
      decideCognitoResume({
        storage,
        ready: false,
        signedIn: false,
        cognitoConfigured: true,
        apiBase: '',
      }),
    ).toBe('skip')
    expect(takeCognitoRelogin(storage)).toBe(true)
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

  it('shows a generic message and does not log the provider description', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let next = ''
    const result = takeOAuthCallback({
      href: 'https://admin.core-webhook.eu/auth/callback?error=access_denied&error_description=not%20in%20group%20admin',
      storage: memoryStorage(),
      replaceUrl: (value) => {
        next = value
      },
    })
    expect(result).toEqual({
      kind: 'error',
      message: 'No hemos podido iniciar tu sesión. Vuelve a entrar desde la pantalla de acceso.',
    })
    expect(next).toBe('/auth/callback')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
