import { describe, expect, it } from 'vitest'
import { endpoints } from './endpoints'
import { assertResourceId } from './ids'

describe('resource ids', () => {
  it('encodes a normal id as one path segment', () => {
    expect(endpoints.tenant('club-basquet-sama')).toBe('/tenants/club-basquet-sama')
    expect(endpoints.conversation('club-basquet-sama', 'cbs-01')).toBe(
      '/tenants/club-basquet-sama/conversations/cbs-01',
    )
  })

  it('rejects traversal and characters outside the id pattern', () => {
    expect(() => endpoints.tenant('../escola-harmonia')).toThrow(/no válido/)
    expect(() => endpoints.conversation('club-basquet-sama', '..')).toThrow(/no válido/)
    expect(() => endpoints.document('club', 'doc/secret')).toThrow(/no válido/)
    expect(() => assertResourceId('Club')).toThrow(/no válido/)
  })
})
