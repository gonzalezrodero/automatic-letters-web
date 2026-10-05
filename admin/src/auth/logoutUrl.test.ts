import { describe, expect, it } from 'vitest'
import { acceptedCognitoLogoutUrl } from './logoutUrl'

const host = 'automatic-envelopes-admin-dev.auth.eu-west-1.amazoncognito.com'

describe('acceptedCognitoLogoutUrl', () => {
  it('accepts the Hosted UI logout URL, including a localhost logout_uri', () => {
    const value = `https://${host}/logout?client_id=1oekl4qltck4r8aijfg0k39q9c&logout_uri=http%3A%2F%2Flocalhost%3A5173%2Fadmin%2Flogin`
    expect(acceptedCognitoLogoutUrl(value, host)).toBe(value)
  })

  it('rejects other hosts, schemes, and paths', () => {
    expect(acceptedCognitoLogoutUrl(`http://${host}/logout`, host)).toBeNull()
    expect(acceptedCognitoLogoutUrl('https://evil.example/logout', host)).toBeNull()
    expect(acceptedCognitoLogoutUrl(`https://${host}/oauth2/authorize`, host)).toBeNull()
    expect(acceptedCognitoLogoutUrl(`https://user:pass@${host}/logout`, host)).toBeNull()
    expect(acceptedCognitoLogoutUrl('javascript:alert(1)', host)).toBeNull()
    expect(acceptedCognitoLogoutUrl(`https://${host}/logout`, null)).toBeNull()
  })
})
