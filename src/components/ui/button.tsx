import { type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'subtle'
  size?: 'sm' | 'md'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        size === 'md' && 'h-11 px-4 text-sm',
        size === 'sm' && 'h-9 px-3 text-sm',
        variant === 'primary' && 'bg-mz-accent text-white hover:bg-mz-accent-deep',
        variant === 'ghost' &&
          'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-mz-border dark:bg-mz-surface dark:text-slate-200 dark:hover:bg-mz-elevated',
        variant === 'subtle' &&
          'bg-mz-out text-mz-accent-deep hover:bg-blue-100 dark:bg-mz-accent/15 dark:text-blue-200',
        className,
      )}
      {...props}
    />
  )
}
