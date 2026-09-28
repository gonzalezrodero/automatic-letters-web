import { useEffect, useState } from 'react'
import { useAdmin } from '../auth/AdminContext'

export function SettingsPage() {
  const { api, tenant, replaceTenant } = useAdmin()
  const [prompt, setPrompt] = useState(tenant.systemPrompt)
  const [url, setUrl] = useState(tenant.privacyPolicyUrl)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPrompt(tenant.systemPrompt)
    setUrl(tenant.privacyPolicyUrl)
    setNotice(null)
    setError(null)
  }, [tenant.id, tenant.systemPrompt, tenant.privacyPolicyUrl])

  const dirty = prompt !== tenant.systemPrompt || url !== tenant.privacyPolicyUrl

  async function save() {
    setError(null)
    setNotice(null)
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('La política de privacidad tiene que ser una URL http o https.')
      }
    } catch (reason) {
      setError(reason instanceof TypeError ? 'La URL de privacidad no es válida.' : (reason as Error).message)
      return
    }
    if (!prompt.trim()) {
      setError('La persona del bot no puede quedar vacía.')
      return
    }
    setSaving(true)
    try {
      const updated = await api.updateTenantSettings(tenant.id, {
        systemPrompt: prompt.trim(),
        privacyPolicyUrl: url.trim(),
      })
      replaceTenant(updated)
      setNotice('Guardado en esta demo. En producción actualizaría el TenantProfile.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function reset() {
    await api.resetDemo()
    window.location.reload()
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px] sm:px-8 sm:py-8">
        <div>
          <h1 className="font-display text-4xl">Ajustes del bot</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Persona y enlace de privacidad de {tenant.name}. El número de WhatsApp lo asigna Meta y aquí solo se
            muestra.
          </p>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-sm font-medium">Persona · system prompt</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={16}
              className="w-full resize-y rounded-3xl border border-line bg-card px-4 py-3 leading-relaxed outline-none focus:border-moss"
            />
            <span className="mt-1 block text-xs text-ink-soft">{prompt.trim().length} caracteres</span>
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium">URL de la política de privacidad</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none focus:border-moss"
              inputMode="url"
            />
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Id del tenant" value={tenant.id} />
            <Field label="Phone number ID de WhatsApp" value={tenant.botPhoneNumberId} />
          </div>

          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
          {notice ? (
            <p className="fixed right-5 bottom-5 z-50 max-w-sm rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-lg" role="status">
              {notice}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={() => void save()}
              className="rounded-2xl bg-moss px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => void reset()} className="text-sm text-ink-soft underline">
              Restaurar datos de demostración
            </button>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-line bg-ink p-5 text-white lg:sticky lg:top-6">
          <p className="text-xs tracking-[0.16em] text-white/50 uppercase">Cómo se presenta</p>
          <p className="mt-3 font-display text-2xl">{tenant.shortName}</p>
          <p className="mt-1 text-sm text-white/60">{tenant.displayPhone}</p>
          <p className="mt-4 line-clamp-8 text-sm leading-relaxed text-white/80">{prompt}</p>
          <a href={url} className="mt-4 block truncate text-sm text-bot hover:underline" target="_blank" rel="noreferrer">
            {url}
          </a>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        readOnly
        value={value}
        className="w-full rounded-2xl border border-line bg-sand/50 px-4 py-3 text-ink-soft"
      />
    </label>
  )
}
