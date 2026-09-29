import { describe, expect, it } from 'vitest'
import { safeInternalPath, safeNavigationUrl } from './safeUrl'

describe('safeNavigationUrl', () => {
  it('allows https and loopback http', () => {
    expect(safeNavigationUrl('https://www.cbsama.cat/privacitat')).toBe('https://www.cbsama.cat/privacitat')
    expect(safeNavigationUrl('http://localhost:5173/privacy')).toBe('http://localhost:5173/privacy')
    expect(safeNavigationUrl('http://127.0.0.1/privacy')).toBe('http://127.0.0.1/privacy')
  })

  it('rejects public http, javascript and data urls', () => {
    expect(safeNavigationUrl('http://www.cbsama.cat/privacitat')).toBeNull()
    expect(safeNavigationUrl('javascript:alert(1)')).toBeNull()
    expect(safeNavigationUrl('data:text/html,hi')).toBeNull()
    expect(safeNavigationUrl('https://user:pass@cbsama.cat/')).toBeNull()
  })
})

describe('safeInternalPath', () => {
  it('keeps app paths and drops absolute urls', () => {
    expect(safeInternalPath('/conversaciones')).toBe('/conversaciones')
    expect(safeInternalPath('https://evil.example')).toBe('/')
    expect(safeInternalPath('//evil.example')).toBe('/')
    expect(safeInternalPath(undefined)).toBe('/')
  })
})
