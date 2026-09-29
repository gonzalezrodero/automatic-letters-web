import { RESOURCE_ID } from '../api/ids'

export type Role = 'superadmin' | 'tenant'

export interface DisplaySession {
  email: string
  name: string
  /** Display only. The API must authorize from the token, not from this value. */
  role: Role
  tenantId: string | null
  groups: string[]
}

/**
 * `admin` wins over any tenant group. Other groups are tenant ids.
 * The result is a label for the UI. It is not an authorization decision.
 */
export function sessionFromGroups(email: string, name: string, groups: readonly string[]): DisplaySession {
  const clean = groups.filter((group) => group.trim().length > 0)
  if (clean.includes('admin')) {
    return { email, name, role: 'superadmin', tenantId: null, groups: clean }
  }
  const tenantId = clean.find((group) => RESOURCE_ID.test(group)) ?? null
  return { email, name, role: 'tenant', tenantId, groups: clean }
}
