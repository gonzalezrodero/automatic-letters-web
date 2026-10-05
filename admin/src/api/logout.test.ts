import { describe, expect, it, vi } from 'vitest'
import { requestApiLogout } from './logout'

const host = 'automatic-envelopes-admin-dev.auth.eu-west-1.amazoncognito.com'

describe('requestApiLogout', () => {
  it('posts with credentials and returns a safe cognitoLogoutUrl', async () => {
    let method = ''
    let credentials: RequestCredentials | undefined
    const fetchImpl: typeof fetch = async (url, init) => {
      method = init?.method ?? ''
      credentials = init?.credentials
      expect(String(url)).toBe(
        'https://npszewzrclcar6mehcbigdfhge0blmpb.lambda-url.eu-west-1.on.aws/auth/logout',
      )
      return new Response(
        JSON.stringify({
          cognitoLogoutUrl: `https://${host}/logout?client_id=abc&logout_uri=http%3A%2F%2Flocalhost%3A5173%2Fadmin%2Flogin`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const url = await requestApiLogout(
      'https://npszewzrclcar6mehcbigdfhge0blmpb.lambda-url.eu-west-1.on.aws/',
      host,
      fetchImpl,
    )

    expect(method).toBe('POST')
    expect(credentials).toBe('include')
    expect(url).toContain(`https://${host}/logout`)
  })

  it('returns null when the API URL is not the configured host', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ cognitoLogoutUrl: 'https://evil.example/logout' }), { status: 200 })
    await expect(requestApiLogout('https://api.example', host, fetchImpl)).resolves.toBeNull()
    spy.mockRestore()
  })
})
