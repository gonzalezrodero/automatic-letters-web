import { useEffect, useRef, useState } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import type { KnowledgeDocument } from '../api/types'
import { useAdmin } from '../auth/AdminContext'
import { formatBytes, formatListTime } from '../lib/format'

export function KnowledgePage() {
  const { api, tenant } = useAdmin()
  const inputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<KnowledgeDocument[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  async function refresh() {
    const list = await api.listDocuments(tenant.id)
    setDocuments(list)
    return list
  }

  useEffect(() => {
    let cancel = false
    setDocuments(null)
    api
      .listDocuments(tenant.id)
      .then((list) => {
        if (!cancel) setDocuments(list)
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : 'No se pudo cargar.')
      })
    return () => {
      cancel = true
    }
  }, [api, tenant.id])

  async function ingest(files: FileList | File[]) {
    setError(null)
    const list = [...files]
    for (const file of list) {
      try {
        await api.uploadDocument(tenant.id, file)
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'No se pudo subir el archivo.')
      }
    }
    const current = await refresh()
    if (current.some((doc) => doc.status === 'processing')) {
      window.setTimeout(() => {
        void refresh()
      }, 1100)
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
        <h1 className="font-display text-4xl">Conocimiento</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Documentos que el bot de {tenant.shortName} trocea para responder. La subida de esta demo no llama al
          servidor: marca el archivo como indexado al cabo de un momento.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            if (event.dataTransfer.files.length) void ingest(event.dataTransfer.files)
          }}
          className={`mt-6 flex w-full flex-col items-center rounded-3xl border border-dashed px-6 py-10 text-center ${
            dragging ? 'border-moss bg-foam' : 'border-line bg-card'
          }`}
        >
          <Upload className="h-6 w-6 text-moss" />
          <span className="mt-3 font-medium">Subir PDF, Markdown o texto</span>
          <span className="mt-1 text-sm text-ink-soft">Arrastra un archivo o pulsa para elegirlo.</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) void ingest(event.target.files)
            event.target.value = ''
          }}
        />
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
          {documents?.map((document) => (
            <li key={document.id} className="flex items-center gap-3 px-4 py-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sand text-moss-deep">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{document.filename}</p>
                <p className="text-xs text-ink-soft">
                  {formatBytes(document.bytes)} · {document.chunkCount} fragmentos ·{' '}
                  {formatListTime(document.uploadedAt)}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  document.status === 'indexed' ? 'bg-foam text-moss-deep' : 'bg-sand text-ink'
                }`}
              >
                {document.status === 'indexed' ? 'Indexado' : 'Procesando'}
              </span>
              {pendingDelete === document.id ? (
                <button
                  type="button"
                  className="text-sm font-medium text-danger"
                  onClick={() => {
                    void api.deleteDocument(tenant.id, document.id).then(() => refresh())
                    setPendingDelete(null)
                  }}
                >
                  Confirmar
                </button>
              ) : (
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-xl text-ink-soft hover:bg-sand"
                  aria-label={`Quitar ${document.filename}`}
                  onClick={() => setPendingDelete(document.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
        {documents && documents.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Todavía no hay documentos en esta organización.</p>
        ) : null}
      </div>
    </div>
  )
}
