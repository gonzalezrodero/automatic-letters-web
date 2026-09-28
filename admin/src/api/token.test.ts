import { describe, expect, it, vi } from 'vitest'
import { exchangeAuthorizationCode } from './token'

describe('exchangeAuthorizationCode', () => {
  it('posts the code and verifier and drops a refresh token', async () => {
    let sent = ''
    const fetchImpl: typeof fetch = async (_url, init) => {
      sent = String(init?.body ?? '')
      return new Response(
        JSON.stringify({
          email: 'ada@example.com',
          name: 'Ada',
          groups: ['club-basquet-sama', 'admin'],
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const result = await exchangeAuthorizationCode({
      apiBase: 'https://api.core-webhook.eu',
      code: 'code-1',
      codeVerifier: 'verifier-1',
      redirectUri: 'https://admin.core-webhook.eu/auth/callback',
      fetchImpl,
    })

    expect(sent).toContain('"code":"code-1"')
    expect(sent).toContain('"codeVerifier":"verifier-1"')
    expect(result.accessToken).toBe('access-1')
    expect(result.session.role).toBe('superadmin')
    expect(result).not.toHaveProperty('refreshToken')
  })

  it('does not surface the error body', async () => {
    const fetchImpl = vi.fn(async () => new Response('secret stack trace', { status: 500 }))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(
      exchangeAuthorizationCode({
        apiBase: 'https://api.core-webhook.eu',
        code: 'code-1',
        codeVerifier: 'verifier-1',
        redirectUri: 'https://admin.core-webhook.eu/auth/callback',
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow('El servidor no ha podido completar la petición.')
    spy.mockRestore()
  })
})
