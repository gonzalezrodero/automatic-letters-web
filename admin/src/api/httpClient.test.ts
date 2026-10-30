import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearCredential, setCookieSession } from '../auth/credentials'
import { createHttpAdminApi } from './httpClient'

const UNREADABLE = 'No hemos podido leer la respuesta. Vuelve a intentarlo.'

describe('createHttpAdminApi', () => {
  afterEach(() => {
    clearCredential()
    vi.unstubAllGlobals()
  })

  it('throws a fixed sentence when a successful response is not JSON', async () => {
    setCookieSession()
    const body = '<html>not-json</html>'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body, { status: 200, headers: { 'Content-Type': 'text/html' } })),
    )

    const api = createHttpAdminApi('https://api.example')
    const error = await api.listTenants().then(
      () => null,
      (reason: unknown) => reason,
    )

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(SyntaxError)
    if (!(error instanceof Error)) return
    expect(error.message).toBe(UNREADABLE)
    expect(error.message).not.toContain('not-json')
    expect(error.message).not.toContain('<html>')
  })
})
