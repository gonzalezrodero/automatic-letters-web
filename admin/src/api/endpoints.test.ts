import { describe, expect, it } from 'vitest'
import { endpoints } from './endpoints'
import { assertResourceId } from './ids'

describe('resource ids', () => {
  it('keeps the auth paths used by the cookie BFF', () => {
    expect(endpoints.me).toBe('/me')
    expect(endpoints.token).toBe('/auth/token')
    expect(endpoints.logout).toBe('/auth/logout')
  })

  it('encodes a normal id as one path segment', () => {
    expect(endpoints.tenant('example-tenant')).toBe('/tenants/example-tenant')
    expect(endpoints.document('example-tenant', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(
      '/tenants/example-tenant/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    )
    expect(endpoints.answerUnanswered('example-tenant', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(
      '/tenants/example-tenant/unanswered/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    )
    expect(endpoints.answered('example-tenant')).toBe('/tenants/example-tenant/unanswered/answered')
    expect(endpoints.reviseUnanswered('example-tenant', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(
      '/tenants/example-tenant/unanswered/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/revision',
    )
    expect(endpoints.discardUnanswered('example-tenant', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(
      '/tenants/example-tenant/unanswered/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/discard',
    )
  })

  it('rejects traversal and characters outside the id pattern', () => {
    expect(() => endpoints.tenant('../other-tenant')).toThrow(/no válido/)
    expect(() => endpoints.conversation('example-tenant', '..')).toThrow(/no válido/)
    expect(() => endpoints.document('club', 'doc/secret')).toThrow(/no válido/)
    expect(() => assertResourceId('Club')).toThrow(/no válido/)
  })
})
