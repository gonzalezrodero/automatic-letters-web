import { createHttpAdminApi } from './httpClient'
import { createMockAdminApi } from './mockClient'
import type { AdminApi } from './types'

export function apiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_API_BASE?.trim())
}

export function createAdminApi(): AdminApi {
  const base = import.meta.env.VITE_API_BASE?.trim()
  if (base) return createHttpAdminApi(base)
  return createMockAdminApi()
}

export type { AdminApi } from './types'
