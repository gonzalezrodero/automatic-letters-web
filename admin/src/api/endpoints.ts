import { resourceSegment } from './ids'

/** Paths the HTTP client will call. Keep the README list in sync with this file. */
export const endpoints = {
  me: '/me',
  token: '/auth/token',
  tenants: '/tenants',
  tenant: (tenantId: string) => `/tenants/${resourceSegment(tenantId)}`,
  dashboard: (tenantId: string) => `/tenants/${resourceSegment(tenantId)}/dashboard`,
  conversations: (tenantId: string) => `/tenants/${resourceSegment(tenantId)}/conversations`,
  conversation: (tenantId: string, conversationId: string) =>
    `/tenants/${resourceSegment(tenantId)}/conversations/${resourceSegment(conversationId)}`,
  documents: (tenantId: string) => `/tenants/${resourceSegment(tenantId)}/documents`,
  document: (tenantId: string, documentId: string) =>
    `/tenants/${resourceSegment(tenantId)}/documents/${resourceSegment(documentId)}`,
} as const
