import { getCredential } from '../auth/credentials'
import { endpoints } from './endpoints'
import { UnavailableApiError, publicApiError } from './errors'
import type { AdminApi, TenantProfile, TenantSettingsPatch } from './types'

const MISSING_SESSION = 'No hay sesión con el API. Entra con Cognito.'

/**
 * Real client for the .NET API. Unused while VITE_API_BASE is empty.
 * Sends credentials: 'include' so the BFF cookies (ae_access, and ae_id on /me)
 * travel with the request. A bearer header is added only for an explicit
 * in-memory bearer credential. The Cognito callback does not set one, because
 * Authorization would make the API ignore ae_access. Tokens are not read from
 * web storage.
 */
export function createHttpAdminApi(baseUrl: string): AdminApi {
  const root = baseUrl.replace(/\/$/, '')

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const credential = getCredential()
    if (!credential) throw new Error(MISSING_SESSION)

    const headers = new Headers(init.headers)
    if (credential.kind === 'bearer') {
      headers.set('Authorization', `Bearer ${credential.accessToken}`)
    }
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    let response: Response
    try {
      response = await fetch(`${root}${path}`, {
        ...init,
        headers,
        credentials: 'include',
      })
    } catch (error) {
      console.error('API error', error)
      throw new Error('No se ha podido contactar con el servidor.')
    }

    if (!response.ok) {
      const detail = await response.text()
      throw publicApiError(response.status, detail)
    }
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  return {
    listTenants() {
      return request<TenantProfile[]>(endpoints.tenants)
    },
    getTenant(tenantId) {
      return request<TenantProfile>(endpoints.tenant(tenantId))
    },
    updateTenantSettings(tenantId, patch: TenantSettingsPatch) {
      return request<TenantProfile>(endpoints.tenant(tenantId), {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
    },
    getDashboard() {
      return Promise.reject(new UnavailableApiError())
    },
    listConversations() {
      return Promise.reject(new UnavailableApiError())
    },
    getConversation() {
      return Promise.reject(new UnavailableApiError())
    },
    listDocuments() {
      return Promise.reject(new UnavailableApiError())
    },
    uploadDocument() {
      return Promise.reject(new UnavailableApiError())
    },
    deleteDocument() {
      return Promise.reject(new UnavailableApiError())
    },
    async resetDemo() {
      throw new Error('Restablecer la demo solo existe en el cliente simulado.')
    },
  }
}
