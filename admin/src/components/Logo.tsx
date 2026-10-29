import { cn } from '../lib/format'

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'grid h-10 w-10 place-items-center rounded-2xl',
          light ? 'bg-paper/15 text-paper' : 'bg-moss text-paper',
        )}
      >
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6.5 11.2c0-1.8 1.4-3.2 3.2-3.2h12.6c1.8 0 3.2 1.4 3.2 3.2v7.1c0 1.8-1.4 3.2-3.2 3.2h-6.2l-4.2 3.4v-3.4H9.7c-1.8 0-3.2-1.4-3.2-3.2v-7.1z"
          />
          <circle cx="12.2" cy="14.6" r="1.25" fill="#0f766e" />
          <circle cx="16" cy="14.6" r="1.25" fill="#0f766e" />
          <circle cx="19.8" cy="14.6" r="1.25" fill="#0f766e" />
        </svg>
      </span>
      {compact ? null : (
        <span>
          <span className={cn('block font-display text-[1.15rem] font-bold leading-none', light && 'text-paper')}>
            Automatic Letters
          </span>
          <span className={cn('mt-1 block text-xs', light ? 'text-paper' : 'text-ink-soft')}>
            Portal
          </span>
        </span>
      )}
    </div>
  )
}
