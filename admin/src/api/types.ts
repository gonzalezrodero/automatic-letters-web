export type Language = 'es' | 'ca' | 'en'

export type ConversationEvent =
  | { type: 'MessageReceived'; text: string; at: string }
  | { type: 'ReplyGenerated'; text: string; at: string }

export interface TenantProfile {
  id: string
  name: string
  shortName: string
  city: string
  kind: string
  botPhoneNumberId: string
  displayPhone: string
  systemPrompt: string
  privacyPolicyUrl: string
}

export interface Conversation {
  id: string
  tenantId: string
  /** E.164. Empty once a GDPR deletion has anonymized the thread. */
  userPhone: string
  language: Language
  topic: string
  anonymized: boolean
  deletionRequestedAt?: string
  events: ConversationEvent[]
}

export interface ConversationQuery {
  q?: string
  language?: Language | 'all'
  from?: string
  to?: string
  includeAnonymized?: boolean
}

export type DocumentStatus = 'processing' | 'indexed'

export interface KnowledgeDocument {
  id: string
  tenantId: string
  filename: string
  mime: 'application/pdf' | 'text/markdown' | 'text/plain'
  bytes: number
  uploadedAt: string
  chunkCount: number
  status: DocumentStatus
}

export interface DayActivity {
  date: string
  label: string
  received: number
  replied: number
}

export interface TopicCount {
  topic: string
  count: number
}

export interface LanguageCount {
  language: Language
  count: number
}

export interface ConversationPreview {
  id: string
  topic: string
  language: Language
  preview: string
  at: string
  anonymized: boolean
  phoneMasked: string
}

export interface DashboardStats {
  generatedAt: string
  windowLabel: string
  conversationCount: number
  messagesThisWeek: number
  activeUsers: number
  deletionRequests: number
  topTopic: TopicCount | null
  topics: TopicCount[]
  languages: LanguageCount[]
  activity: DayActivity[]
  recent: ConversationPreview[]
}

export interface TenantSettingsPatch {
  systemPrompt: string
  privacyPolicyUrl: string
}

/**
 * Data boundary used by the UI. `createMockAdminApi` implements it in memory.
 * `createHttpAdminApi` is the same contract against the .NET backend.
 */
export interface AdminApi {
  listTenants(): Promise<TenantProfile[]>
  getTenant(tenantId: string): Promise<TenantProfile>
  updateTenantSettings(tenantId: string, patch: TenantSettingsPatch): Promise<TenantProfile>
  getDashboard(tenantId: string): Promise<DashboardStats>
  listConversations(tenantId: string, query: ConversationQuery): Promise<Conversation[]>
  getConversation(tenantId: string, conversationId: string): Promise<Conversation>
  listDocuments(tenantId: string): Promise<KnowledgeDocument[]>
  uploadDocument(tenantId: string, file: File): Promise<KnowledgeDocument>
  deleteDocument(tenantId: string, documentId: string): Promise<void>
  resetDemo(): Promise<void>
}
