import { describe, expect, it } from 'vitest'
import { sessionFromGroups } from './groups'

describe('sessionFromGroups', () => {
  it('lets the admin group win over a tenant group', () => {
    const session = sessionFromGroups('ada@example.com', 'Ada', ['example-tenant', 'admin'])
    expect(session.role).toBe('superadmin')
    expect(session.tenantId).toBeNull()
  })

  it('maps a single tenant group to that id', () => {
    const session = sessionFromGroups('ada@example.com', 'Ada', ['example-tenant'])
    expect(session.role).toBe('tenant')
    expect(session.tenantId).toBe('example-tenant')
  })

  it('does not treat a non-matching group as admin', () => {
    const session = sessionFromGroups('ada@example.com', 'Ada', ['Admin'])
    expect(session.role).toBe('tenant')
    expect(session.tenantId).toBeNull()
  })
})
