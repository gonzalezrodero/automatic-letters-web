/** Paths the HTTP client will call. Keep the README list in sync with this file. */
export const endpoints = {
  me: '/me',
  tenants: '/tenants',
  tenant: (tenantId: string) => `/tenants/${tenantId}`,
  dashboard: (tenantId: string) => `/tenants/${tenantId}/dashboard`,
  conversations: (tenantId: string) => `/tenants/${tenantId}/conversations`,
  conversation: (tenantId: string, conversationId: string) =>
    `/tenants/${tenantId}/conversations/${conversationId}`,
  documents: (tenantId: string) => `/tenants/${tenantId}/documents`,
  document: (tenantId: string, documentId: string) =>
    `/tenants/${tenantId}/documents/${documentId}`,
} as const
