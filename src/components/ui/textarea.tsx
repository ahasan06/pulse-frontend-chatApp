import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'max-h-32 min-h-11 w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 dark:bg-slate-900 dark:text-slate-100',
          invalid
            ? 'border-red-400 focus:border-red-400'
            : 'border-slate-200 focus:border-blue-500 dark:border-slate-700',
          className,
        )}
        {...props}
      />
    )
  },
)
