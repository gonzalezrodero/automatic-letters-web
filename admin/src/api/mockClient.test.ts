import { describe, expect, it } from 'vitest'
import { matchesQuery, searchablePhone } from './mockClient'
import type { Conversation } from './types'

const thread: Conversation = {
  id: 'thread-01',
  tenantId: 'example-tenant',
  userPhone: '+34611223301',
  language: 'ca',
  topic: 'Inscripció',
  anonymized: false,
  events: [],
}

describe('searchablePhone', () => {
  it('includes the full number for search without being a display mask', () => {
    const terms = searchablePhone('+34611223301')
    expect(terms).toContain('+34611223301')
    expect(terms).toContain('34611223301')
    expect(terms).not.toContain('**')
  })

  it('matches the full E.164 and the visible digits', () => {
    expect(matchesQuery(thread, { q: '+34611223301' })).toBe(true)
    expect(matchesQuery(thread, { q: '611223301' })).toBe(true)
    expect(matchesQuery(thread, { q: '611' })).toBe(true)
  })
})