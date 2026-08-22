import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-mz-accent/30 dark:bg-mz-surface dark:text-slate-100 dark:placeholder:text-slate-500',
          invalid
            ? 'border-red-400 focus:border-red-400'
            : 'border-slate-200 focus:border-mz-accent dark:border-mz-border',
          className,
        )}
        {...props}
      />
    )
  },
)
