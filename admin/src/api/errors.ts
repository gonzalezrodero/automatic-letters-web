/** The HTTP API does not implement this screen yet. Mock mode still does. */
export class UnavailableApiError extends Error {
  constructor() {
    super('Esta pantalla todavía no está en el API.')
    this.name = 'UnavailableApiError'
  }
}

export function isUnavailable(reason: unknown): reason is UnavailableApiError {
  return reason instanceof UnavailableApiError
}

/** Fixed copy per status. The response body is never returned to the UI. */
export function messageForStatus(status: number): string {
  if (status === 401) return 'La sesión ha caducado. Vuelve a entrar.'
  if (status === 403) return 'No tienes acceso a esta organización.'
  if (status === 404) return 'No encontramos ese recurso.'
  if (status === 400 || status === 422) return 'La petición no es válida.'
  if (status >= 500) return 'El servidor no ha podido completar la petición.'
  return 'No se ha podido completar la petición.'
}

export function publicApiError(status: number, detail: string): Error {
  console.error('API error', status, detail.slice(0, 2000))
  return new Error(messageForStatus(status))
}
