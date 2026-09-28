import { endpoints } from './endpoints'
import type {
  AdminApi,
  Conversation,
  ConversationQuery,
  DashboardStats,
  KnowledgeDocument,
  TenantProfile,
  TenantSettingsPatch,
} from './types'

/**
 * Real client for the .NET API (automatic-envelopes). Unused while
 * VITE_API_BASE is empty. The bearer token is the Cognito access token
 * obtained after the Hosted UI code exchange — this portal does not
 * exchange the code itself.
 */
export function createHttpAdminApi(baseUrl: string, getAccessToken: () => string | null): AdminApi {
  const root = baseUrl.replace(/\/$/, '')

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    const response = await fetch(`${root}${path}`, { ...init, headers })
    if (!response.ok) {
      const detail = await response.text()
      throw new Error(detail || `La API ha respondido ${response.status}.`)
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
      const params = new URLSearchParams()
      if (query.q) params.set('q', query.q)
      if (query.language && query.language !== 'all') params.set('language', query.language)
      if (query.from) params.set('from', query.from)
      if (query.to) params.set('to', query.to)
      if (query.includeAnonymized === false) params.set('includeAnonymized', 'false')
      const qs = params.toString()
      return request<Conversation[]>(
        `${endpoints.conversations(tenantId)}${qs ? `?${qs}` : ''}`,
      )
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
