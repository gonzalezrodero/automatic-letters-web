import { describe, expect, it } from 'vitest'
import { tenantPlaceLine, tenantShortLabel, tenantTitle } from './tenantLabel'

describe('tenant labels', () => {
  it('uses the id when name and short name are blank', () => {
    const tenant = { id: 'example-tenant', name: '  ', shortName: '', city: '', kind: '' }
    expect(tenantTitle(tenant)).toBe('example-tenant')
    expect(tenantShortLabel(tenant)).toBe('example-tenant')
    expect(tenantPlaceLine(tenant)).toBe('')
  })

  it('keeps stored labels and skips an empty half of the place line', () => {
    const tenant = { id: 'example-tenant', name: ' Example ', shortName: 'Ex', city: 'Town', kind: '  ' }
    expect(tenantTitle(tenant)).toBe('Example')
    expect(tenantShortLabel(tenant)).toBe('Ex')
    expect(tenantPlaceLine(tenant)).toBe('Town')
  })
})
