import { describe, expect, it, vi } from 'vitest'
import { fetchSessionProfile } from './session'

describe('fetchSessionProfile', () => {
  it('calls GET /me with credentials and maps groups', async () => {
    let credentials: RequestCredentials | undefined
    const fetchImpl: typeof fetch = async (url, init) => {
      credentials = init?.credentials
      expect(String(url)).toBe('https://api.example/me')
      return new Response(JSON.stringify({ email: 'ada@example.com', name: 'Ada', groups: ['admin'] }), {
        status: 200,
      })
    }

    const session = await fetchSessionProfile('https://api.example/', fetchImpl)
    expect(credentials).toBe('include')
    expect(session?.role).toBe('superadmin')
    expect(session?.email).toBe('ada@example.com')
  })

  it('returns null on 401', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchImpl: typeof fetch = async () => new Response('no cookie', { status: 401 })
    await expect(fetchSessionProfile('https://api.example', fetchImpl)).resolves.toBeNull()
    spy.mockRestore()
  })
})
