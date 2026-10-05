import { resourceSegment } from './ids'

/** Live paths plus the later panel, conversation, and document contract. The HTTP client only calls the live ones. */
export const endpoints = {
  me: '/me',
  token: '/auth/token',
  logout: '/auth/logout',
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
