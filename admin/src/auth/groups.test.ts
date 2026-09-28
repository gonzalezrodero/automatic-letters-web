import { describe, expect, it } from 'vitest'
import { sessionFromGroups } from './groups'

describe('sessionFromGroups', () => {
  it('lets the admin group win over a tenant group', () => {
    const session = sessionFromGroups('ada@example.com', 'Ada', ['club-basquet-sama', 'admin'])
    expect(session.role).toBe('superadmin')
    expect(session.tenantId).toBeNull()
  })

  it('maps a single tenant group to that id', () => {
    const session = sessionFromGroups('nuria@cbsama.cat', 'Núria', ['club-basquet-sama'])
    expect(session.role).toBe('tenant')
    expect(session.tenantId).toBe('club-basquet-sama')
  })

  it('does not treat a non-matching group as admin', () => {
    const session = sessionFromGroups('ada@example.com', 'Ada', ['Admin'])
    expect(session.role).toBe('tenant')
    expect(session.tenantId).toBeNull()
  })
})
