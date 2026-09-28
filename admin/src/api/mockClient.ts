import { SEED_VERSION, seedDatabase, type DemoDatabase } from '../data/seed'
import { activityTime, maskPhone } from '../lib/format'
import { buildDashboard, inDateRange } from '../lib/stats'
import type { AdminApi, Conversation, ConversationQuery, KnowledgeDocument, TenantProfile } from './types'

const STORAGE_KEY = 'al.demo.db'

function cloneSeed(): DemoDatabase {
  return structuredClone(seedDatabase)
}

function loadDatabase(): DemoDatabase {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneSeed()
    const parsed = JSON.parse(raw) as DemoDatabase
    if (parsed.version !== SEED_VERSION) return cloneSeed()
    return parsed
  } catch {
    return cloneSeed()
  }
}

function wait(ms = 70) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mimeFromName(name: string, type: string): KnowledgeDocument['mime'] | null {
  const lower = name.toLowerCase()
  if (type === 'application/pdf' || lower.endsWith('.pdf')) return 'application/pdf'
  if (type === 'text/markdown' || lower.endsWith('.md') || lower.endsWith('.markdown')) {
    return 'text/markdown'
  }
  if (type === 'text/plain' || lower.endsWith('.txt')) return 'text/plain'
  return null
}

function matchesQuery(conversation: Conversation, query: ConversationQuery): boolean {
  if (!query.includeAnonymized && conversation.anonymized) return false
  if (query.language && query.language !== 'all' && conversation.language !== query.language) {
    return false
  }
  const when = activityTime(conversation)
  if (when && !inDateRange(when, query.from, query.to)) return false
  const q = query.q?.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    conversation.topic,
    conversation.language,
    conversation.anonymized ? 'anonimizado borrado gdpr número eliminado' : maskPhone(conversation.userPhone),
    ...conversation.events.map((event) => event.text),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

export function createMockAdminApi(): AdminApi {
  let db = loadDatabase()

  const persist = () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  }

  const requireTenant = (tenantId: string): TenantProfile => {
    const tenant = db.tenants.find((item) => item.id === tenantId)
    if (!tenant) throw new Error('No existe esta organización.')
    return tenant
  }

  return {
    async listTenants() {
      await wait()
      return db.tenants.map((tenant) => structuredClone(tenant))
    },
    async getTenant(tenantId) {
      await wait()
      return structuredClone(requireTenant(tenantId))
    },
    async updateTenantSettings(tenantId, patch) {
      await wait(120)
      const tenant = requireTenant(tenantId)
      tenant.systemPrompt = patch.systemPrompt
      tenant.privacyPolicyUrl = patch.privacyPolicyUrl
      persist()
      return structuredClone(tenant)
    },
    async getDashboard(tenantId) {
      await wait()
      requireTenant(tenantId)
      const conversations = db.conversations.filter((item) => item.tenantId === tenantId)
      return buildDashboard(conversations)
    },
    async listConversations(tenantId, query) {
      await wait()
      requireTenant(tenantId)
      return db.conversations
        .filter((item) => item.tenantId === tenantId && matchesQuery(item, query))
        .sort((a, b) => activityTime(b).localeCompare(activityTime(a)))
        .map((item) => structuredClone(item))
    },
    async getConversation(tenantId, conversationId) {
      await wait()
      requireTenant(tenantId)
      const conversation = db.conversations.find(
        (item) => item.tenantId === tenantId && item.id === conversationId,
      )
      if (!conversation) throw new Error('No encontramos esta conversación.')
      return structuredClone(conversation)
    },
    async listDocuments(tenantId) {
      await wait()
      requireTenant(tenantId)
      return db.documents
        .filter((item) => item.tenantId === tenantId)
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
        .map((item) => structuredClone(item))
    },
    async uploadDocument(tenantId, file: File) {
      requireTenant(tenantId)
      const mime = mimeFromName(file.name, file.type)
      if (!mime) {
        throw new Error('Solo aceptamos PDF, Markdown o texto (.pdf, .md, .txt).')
      }
      const document: KnowledgeDocument = {
        id: `doc-${crypto.randomUUID()}`,
        tenantId,
        filename: file.name,
        mime,
        bytes: file.size,
        uploadedAt: new Date().toISOString(),
        chunkCount: Math.max(1, Math.round(file.size / 1800)),
        status: 'processing',
      }
      db.documents = [document, ...db.documents]
      persist()
      window.setTimeout(() => {
        const current = db.documents.find((item) => item.id === document.id)
        if (!current) return
        current.status = 'indexed'
        persist()
      }, 900)
      await wait(80)
      return structuredClone(document)
    },
    async deleteDocument(tenantId, documentId) {
      await wait()
      requireTenant(tenantId)
      db.documents = db.documents.filter(
        (item) => !(item.tenantId === tenantId && item.id === documentId),
      )
      persist()
    },
    async resetDemo() {
      db = cloneSeed()
      sessionStorage.removeItem(STORAGE_KEY)
      await wait()
    },
  }
}
