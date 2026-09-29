import { describe, expect, it } from 'vitest'
import { conversationSearchParams } from './query'

describe('conversationSearchParams', () => {
  it('always sends includeAnonymized', () => {
    expect(conversationSearchParams({}).get('includeAnonymized')).toBe('true')
    expect(conversationSearchParams({ includeAnonymized: true }).get('includeAnonymized')).toBe('true')
    expect(conversationSearchParams({ includeAnonymized: false }).get('includeAnonymized')).toBe('false')
  })
})
