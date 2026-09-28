const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/** https anywhere. http only when the host is loopback, so a preview href cannot become javascript: or data:. */
export function safeNavigationUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (url.username || url.password) return null
  if (url.protocol === 'https:') return url.toString()
  if (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname)) return url.toString()
  return null
}

/** In-app path only. Rejects protocol-relative and absolute URLs. */
export function safeInternalPath(value: unknown): string {
  if (typeof value !== 'string') return '/'
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) return '/'
  return value
}
