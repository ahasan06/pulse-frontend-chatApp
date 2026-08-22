import { cn } from '../../lib/cn'

type BrandMarkProps = {
  variant?: 'sidebar' | 'header'
  className?: string
}

export function BrandMark({ variant = 'header', className }: BrandMarkProps) {
  if (variant === 'sidebar') {
    return (
      <div className={cn('flex min-w-0 items-center gap-1.5', className)}>
        <img
          src="/logo.png"
          alt="Pulse"
          className="h-7 w-auto max-w-[7.75rem] object-contain object-left mix-blend-screen"
        />
        <span className="shrink-0 text-[13px] font-medium text-white/65">| Chat</span>
      </div>
    )
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <img
        src="/favicon.png"
        alt=""
        className="h-8 w-8 shrink-0 object-contain"
      />
      <p className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Pulse <span className="font-medium text-slate-500 dark:text-slate-400">| Chat</span>
      </p>
    </div>
  )
}
