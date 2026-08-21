import { type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

export function Button({
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' &&
          'bg-emerald-400 text-slate-950 hover:bg-emerald-300',
        variant === 'ghost' &&
          'border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800',
        className,
      )}
      {...props}
    />
  )
}
