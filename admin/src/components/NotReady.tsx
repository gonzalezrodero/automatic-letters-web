export function NotReady({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="mt-3 text-sm text-ink-soft">{detail}</p>
      </div>
    </div>
  )
}
