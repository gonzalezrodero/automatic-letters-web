import { createHttpAdminApi } from './httpClient'
import { createMockAdminApi } from './mockClient'
import type { AdminApi } from './types'

export function createAdminApi(getAccessToken: () => string | null): AdminApi {
  const base = import.meta.env.VITE_API_BASE?.trim()
  if (base) return createHttpAdminApi(base, getAccessToken)
  return createMockAdminApi()
}

export type { AdminApi } from './types'
