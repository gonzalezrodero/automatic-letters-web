import { describe, expect, it, vi } from 'vitest'
import { exchangeAuthorizationCode } from './token'

describe('exchangeAuthorizationCode', () => {
  it('posts the code and verifier with cookies and drops tokens in the JSON', async () => {
    let sent = ''
    let credentials: RequestCredentials | undefined
    const fetchImpl: typeof fetch = async (_url, init) => {
      sent = String(init?.body ?? '')
      credentials = init?.credentials
      return new Response(
        JSON.stringify({
          email: 'ada@example.com',
          name: 'Ada',
          groups: ['example-tenant', 'admin'],
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await exchangeAuthorizationCode({
      apiBase: 'https://api.core-webhook.eu/',
      code: 'code-1',
      codeVerifier: 'verifier-1',
      redirectUri: 'http://localhost:5173/admin/auth/callback',
      fetchImpl,
    })

    expect(credentials).toBe('include')
    expect(sent).toContain('"code":"code-1"')
    expect(sent).toContain('"codeVerifier":"verifier-1"')
    expect(sent).toContain('"redirectUri":"http://localhost:5173/admin/auth/callback"')
    expect(result.session.role).toBe('superadmin')
    expect(result).not.toHaveProperty('accessToken')
    expect(result).not.toHaveProperty('refreshToken')
    spy.mockRestore()
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
    ).rejects.toThrow('No hemos podido completar la acción. Vuelve a intentarlo dentro de un momento.')
    expect(spy).toHaveBeenCalledWith('API error', 500)
    expect(JSON.stringify(spy.mock.calls)).not.toContain('secret stack trace')
    spy.mockRestore()
  })

  it('rejects a non-JSON success body without surfacing the parser error', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('<html>oops</html>', { status: 200, headers: { 'Content-Type': 'text/html' } }),
    )
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = await exchangeAuthorizationCode({
      apiBase: 'https://api.core-webhook.eu',
      code: 'code-1',
      codeVerifier: 'verifier-1',
      redirectUri: 'https://admin.core-webhook.eu/auth/callback',
      fetchImpl: fetchImpl as typeof fetch,
    }).catch((caught: unknown) => caught)
    const logged = spy.mock.calls
      .flat()
      .map((arg) => (arg instanceof Error ? `${arg.name} ${arg.message}` : String(arg)))
      .join('\n')
    spy.mockRestore()

    expect(error).toBeInstanceOf(Error)
    const message = (error as Error).message
    expect(message).toBe('No hemos podido iniciar tu sesión. Vuelve a entrar desde la pantalla de acceso.')
    for (const leak of ['Unexpected token', 'JSON', '<html>']) {
      expect(message).not.toContain(leak)
      expect(logged).not.toContain(leak)
    }
  })
})
