import { getCredential } from '../auth/credentials'
import { endpoints } from './endpoints'
import { publicApiError } from './errors'
import { conversationSearchParams } from './query'
import type {
  AdminApi,
  Conversation,
  ConversationQuery,
  DashboardStats,
  KnowledgeDocument,
  TenantProfile,
  TenantSettingsPatch,
} from './types'

const MISSING_SESSION = 'No hay sesión con el API. Entra con Cognito.'

/**
 * Real client for the .NET API. Unused while VITE_API_BASE is empty.
 * Refuses to call without an in-memory bearer token or a cookie session
 * confirmed in this tab. Tokens are not read from web storage.
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
    getDashboard(tenantId) {
      return request<DashboardStats>(endpoints.dashboard(tenantId))
    },
    listConversations(tenantId, query: ConversationQuery) {
      const qs = conversationSearchParams(query).toString()
      return request<Conversation[]>(`${endpoints.conversations(tenantId)}?${qs}`)
    },
    getConversation(tenantId, conversationId) {
      return request<Conversation>(endpoints.conversation(tenantId, conversationId))
    },
    listDocuments(tenantId) {
      return request<KnowledgeDocument[]>(endpoints.documents(tenantId))
    },
    uploadDocument(tenantId, file: File) {
      const body = new FormData()
      body.set('file', file)
      return request<KnowledgeDocument>(endpoints.documents(tenantId), {
        method: 'POST',
        body,
      })
    },
    deleteDocument(tenantId, documentId) {
      return request<void>(endpoints.document(tenantId, documentId), { method: 'DELETE' })
    },
    async resetDemo() {
      throw new Error('Restablecer la demo solo existe en el cliente simulado.')
    },
  }
}
