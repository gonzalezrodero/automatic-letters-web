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
