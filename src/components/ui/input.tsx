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
          'h-11 w-full rounded-lg border bg-slate-900/80 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-400/60',
          invalid ? 'border-red-500' : 'border-slate-700 focus:border-emerald-400',
          className,
        )}
        {...props}
      />
    )
  },
)
