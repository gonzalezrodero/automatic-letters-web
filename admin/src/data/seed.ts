import type { Conversation, KnowledgeDocument, TenantProfile, UnansweredQuestion } from '../api/types'

export interface StoredUnanswered extends UnansweredQuestion {
  tenantId: string
  answer?: string
  answeredAt?: string
}

export interface DemoDatabase {
  version: number
  tenants: TenantProfile[]
  conversations: Conversation[]
  documents: KnowledgeDocument[]
  unanswered: StoredUnanswered[]
}

/** Bump when the stored shape changes so an old sessionStorage demo is discarded. */
export const SEED_VERSION = 3

export const seedDatabase: DemoDatabase = {
  version: SEED_VERSION,
  tenants: [],
  conversations: [],
  documents: [],
  unanswered: [],
}
