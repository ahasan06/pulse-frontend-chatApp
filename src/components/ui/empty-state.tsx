import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  className?: string
}

export function EmptyState({ icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('px-6 py-10 text-center', className)}>
      {icon ? (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-mz-out text-mz-accent dark:bg-mz-accent/15 dark:text-blue-300">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  )
}
