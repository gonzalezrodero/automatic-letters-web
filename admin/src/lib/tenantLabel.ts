import type { TenantProfile } from '../api/types'

type NamedTenant = Pick<TenantProfile, 'id' | 'name' | 'shortName'>

/** Stored name, or the tenant id when the document has no label. */
export function tenantTitle(tenant: Pick<TenantProfile, 'id' | 'name'>): string {
  const name = tenant.name.trim()
  return name || tenant.id
}

/** Stored short name, or the same title used when the name is blank. */
export function tenantShortLabel(tenant: NamedTenant): string {
  const shortName = tenant.shortName.trim()
  return shortName || tenantTitle(tenant)
}

/** City and kind, omitting blanks so the line is not a lone separator. */
export function tenantPlaceLine(tenant: Pick<TenantProfile, 'city' | 'kind'>): string {
  return [tenant.city.trim(), tenant.kind.trim()].filter(Boolean).join(' · ')
}
