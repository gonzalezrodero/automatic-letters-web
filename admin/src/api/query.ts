import type { ConversationQuery } from './types'

/** Always sends includeAnonymized as true or false so a default of "omit = hide" cannot drop GDPR threads. */
export function conversationSearchParams(query: ConversationQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  params.set('includeAnonymized', query.includeAnonymized === false ? 'false' : 'true')
  return params
}
