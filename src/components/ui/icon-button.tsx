import { type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
}

export function IconButton({
  className,
  label,
  children,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-300 dark:hover:bg-slate-800',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
