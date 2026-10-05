import type { Conversation, KnowledgeDocument, TenantProfile } from '../api/types'

export interface DemoDatabase {
  version: number
  tenants: TenantProfile[]
  conversations: Conversation[]
  documents: KnowledgeDocument[]
}

/** Bump when the stored shape changes so an old sessionStorage demo is discarded. */
export const SEED_VERSION = 2

export const seedDatabase: DemoDatabase = {
  version: SEED_VERSION,
  tenants: [],
  conversations: [],
  documents: [],
}
