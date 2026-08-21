import { cn } from '../../lib/cn'

type ErrorBannerProps = {
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorBanner({ message, onRetry, className }: ErrorBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700',
        className,
      )}
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="shrink-0 font-medium text-red-800 underline"
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
    </div>
  )
}
