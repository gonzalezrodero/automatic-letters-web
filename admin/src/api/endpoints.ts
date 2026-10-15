import { resourceSegment } from './ids'

/** Paths the portal calls on the .NET API. */
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
  unanswered: (tenantId: string) => `/tenants/${resourceSegment(tenantId)}/unanswered`,
  answered: (tenantId: string) => `/tenants/${resourceSegment(tenantId)}/unanswered/answered`,
  answerUnanswered: (tenantId: string, questionId: string) =>
    `/tenants/${resourceSegment(tenantId)}/unanswered/${resourceSegment(questionId)}`,
  reviseUnanswered: (tenantId: string, questionId: string) =>
    `/tenants/${resourceSegment(tenantId)}/unanswered/${resourceSegment(questionId)}/revision`,
  withdrawUnanswered: (tenantId: string, questionId: string) =>
    `/tenants/${resourceSegment(tenantId)}/unanswered/${resourceSegment(questionId)}`,
} as const
