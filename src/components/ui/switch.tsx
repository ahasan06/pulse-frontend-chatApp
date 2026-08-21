import { HiInformationCircle } from 'react-icons/hi2'
import { cn } from '../../lib/cn'

type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
  showLabel?: boolean
  disabled?: boolean
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
  showLabel = true,
  disabled,
}: SwitchProps) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
      {hint ? (
        <span className="group relative z-20 inline-flex shrink-0">
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/80 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label={hint}
          >
            <HiInformationCircle className="h-4 w-4" />
          </button>
          <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 w-56 max-w-[calc(100vw-2rem)] rounded-lg bg-slate-900 px-2.5 py-1.5 text-left text-[11px] leading-snug text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-slate-700">
            {hint}
          </span>
        </span>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'inline-flex min-w-0 cursor-pointer items-center gap-2 text-left text-xs text-slate-600 dark:text-slate-300',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span
          className={cn(
            'relative h-5 w-9 shrink-0 rounded-full transition',
            checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition',
              checked && 'translate-x-4',
            )}
          />
        </span>
        {showLabel ? (
          <span className="min-w-0 leading-snug break-words">{label}</span>
        ) : null}
      </button>
    </span>
  )
}
