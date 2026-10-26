/** The HTTP API does not implement this screen yet. Mock mode still does. */
export class UnavailableApiError extends Error {
  constructor() {
    super('Esta pantalla todavía no está disponible.')
    this.name = 'UnavailableApiError'
  }
}

export function isUnavailable(reason: unknown): reason is UnavailableApiError {
  return reason instanceof UnavailableApiError
}

/** Fixed copy per status. The response body is never returned to the UI. */
export function messageForStatus(status: number): string {
  if (status === 401) return 'Tu sesión ha caducado. Entra de nuevo para continuar.'
  if (status === 403) return 'Tu cuenta no tiene acceso a esta organización. Pide acceso a quien administra tu club.'
  if (status === 404) return 'No encontramos lo que buscas. Vuelve atrás e inténtalo de nuevo.'
  if (status === 400 || status === 422) return 'No hemos podido guardar esto. Revísalo e inténtalo de nuevo.'
  if (status >= 500) return 'No hemos podido completar la acción. Vuelve a intentarlo dentro de un momento.'
  return 'No hemos podido completar la acción. Vuelve a intentarlo.'
}

export function publicApiError(status: number): Error {
  console.error('API error', status)
  return new Error(messageForStatus(status))
}
