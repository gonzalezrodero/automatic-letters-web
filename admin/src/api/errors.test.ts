import { describe, expect, it, vi } from 'vitest'
import { messageForStatus, publicApiError } from './errors'

describe('publicApiError', () => {
  it('uses a fixed message and does not return the body', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = publicApiError(500, '<html>NullReferenceException at Secret.cs</html>')
    expect(error.message).toBe(messageForStatus(500))
    expect(error.message).not.toContain('NullReference')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
