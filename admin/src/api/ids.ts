/** Tenant, conversation and document ids. Dots are excluded so ".." cannot be a path segment. */
export const RESOURCE_ID = /^[a-z0-9-]+$/

export function assertResourceId(id: string): string {
  if (!RESOURCE_ID.test(id)) {
    throw new Error('No hemos podido abrir esto. Vuelve atrás e inténtalo de nuevo.')
  }
  return id
}

export function resourceSegment(id: string): string {
  return encodeURIComponent(assertResourceId(id))
}
