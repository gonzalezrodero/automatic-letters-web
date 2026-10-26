import { describe, expect, it, vi } from 'vitest'
import { messageForStatus, publicApiError } from './errors'

describe('publicApiError', () => {
  it('uses a fixed message and logs only the status', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = publicApiError(500)
    expect(error.message).toBe(messageForStatus(500))
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('API error', 500)
    spy.mockRestore()
  })
})
