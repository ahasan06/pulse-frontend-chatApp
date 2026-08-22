import { cn } from '../../lib/cn'
import { getInitials } from '../../lib/conversation'

const AVATAR_COLORS = [
  'bg-mz-out text-mz-accent-deep dark:bg-mz-accent/20 dark:text-blue-200',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-200',
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-200',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200',
  'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200',
] as const

function colorForName(name: string) {
  let hash = 0
  for (const char of name.trim().toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

type AvatarProps = {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white font-semibold shadow-sm ring-1 ring-slate-300 dark:border-slate-800 dark:ring-slate-600',
        colorForName(name),
        size === 'sm' && 'h-8 w-8 text-[11px]',
        size === 'md' && 'h-11 w-11 text-sm',
        size === 'lg' && 'h-12 w-12 text-base',
        className,
      )}
    >
      {getInitials(name) || '?'}
    </span>
  )
}
