import { EmptyState } from '../ui/empty-state'
import { ErrorBanner } from '../ui/error-banner'
import { Spinner } from '../ui/spinner'
import type { User } from '../../types/api'
import type { LoadStatus } from '../../types/chat'

type UserSearchResultsProps = {
  query: string
  results: User[]
  status: LoadStatus
  error: string | null
  selectedIds?: string[]
  onSelect: (user: User) => void
}

export function UserSearchResults({
  query,
  results,
  status,
  error,
  selectedIds = [],
  onSelect,
}: UserSearchResultsProps) {
  if (!query.trim()) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        Search by name. Uppercase or lowercase both work.
      </p>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (status === 'error' && error) {
    return <ErrorBanner message={error} />
  }

  if (status === 'ready' && results.length === 0) {
    return (
      <EmptyState
        title="No users found"
        description="Try another name. Uppercase or lowercase both work."
        className="py-6"
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {results.map((user) => {
        const selected = selectedIds.includes(user._id)
        return (
          <li key={user._id}>
            <button
              type="button"
              onClick={() => onSelect(user)}
              className="flex w-full items-center justify-between px-1 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <span>
                <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user.name}
                </span>
                <span className="text-xs text-slate-500">{user.phone}</span>
              </span>
              {selected ? (
                <span className="text-xs font-medium text-mz-accent">Added</span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
