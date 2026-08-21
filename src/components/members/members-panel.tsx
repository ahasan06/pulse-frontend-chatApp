import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { HiMagnifyingGlass, HiOutlineGlobeAlt } from 'react-icons/hi2'
import { getErrorMessage } from '../../lib/api-error'
import { excludeCurrentUser } from '../../lib/conversation'
import { loadMembersDirectory } from '../../lib/members-directory'
import { inboxFilterSchema, type InboxFilterValues } from '../../schemas/search'
import { useAuthStore } from '../../store/auth-store'
import { useChatStore } from '../../store/chat-store'
import { useUserSearch } from '../../hooks/use-user-search'
import type { User } from '../../types/api'
import type { LoadStatus } from '../../types/chat'
import { MobileListHeader } from '../layout/mobile-list-header'
import type { SideNavView } from '../layout/side-nav'
import { Avatar } from '../ui/avatar'
import { EmptyState } from '../ui/empty-state'
import { ErrorBanner } from '../ui/error-banner'
import { Input } from '../ui/input'
import { Spinner } from '../ui/spinner'

const PAGE_SIZE = 20
const LOAD_MORE_DELAY_MS = 2000

type MembersPanelProps = {
  onViewChange: (view: SideNavView) => void
  onOpenNav: () => void
  onStartedChat: () => void
}

export function MembersPanel({
  onViewChange,
  onOpenNav,
  onStartedChat,
}: MembersPanelProps) {
  const currentUserId = useAuthStore((state) => state.user?._id)
  const startDirectChat = useChatStore((state) => state.startDirectChat)
  const [members, setMembers] = useState<User[]>([])
  const [status, setStatus] = useState<LoadStatus>('idle')
  const [harvesting, setHarvesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [shown, setShown] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)
  const loadMoreTimerRef = useRef<number>(0)

  const { register, watch } = useForm<InboxFilterValues>({
    resolver: zodResolver(inboxFilterSchema),
    defaultValues: { q: '' },
  })
  const query = watch('q')
  const searching = query.trim().length > 0
  const search = useUserSearch(query)

  const loadMembers = useCallback(() => {
    setStatus('loading')
    setError(null)
    setHarvesting(true)
    void loadMembersDirectory((users, done) => {
      setMembers(excludeCurrentUser(users, currentUserId))
      setStatus('ready')
      setHarvesting(!done)
    }).catch((reason: unknown) => {
      setStatus('error')
      setHarvesting(false)
      setError(getErrorMessage(reason, 'Could not load members'))
    })
  }, [currentUserId])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const list = searching ? search.results : members
  const listError = searching ? search.error : error
  const showSpinner = searching
    ? search.status === 'loading' || search.status === 'idle'
    : status === 'loading' || status === 'idle'
  const showError = searching ? search.status === 'error' : status === 'error'
  const showList = searching ? search.status === 'ready' : status === 'ready'

  useEffect(() => {
    setShown(PAGE_SIZE)
    setLoadingMore(false)
    loadingMoreRef.current = false
    window.clearTimeout(loadMoreTimerRef.current)
  }, [query])

  const visible = list.slice(0, shown)
  const hasMore = shown < list.length

  const loadNextPage = useCallback(() => {
    if (loadingMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    window.clearTimeout(loadMoreTimerRef.current)
    loadMoreTimerRef.current = window.setTimeout(() => {
      setShown((count) => count + PAGE_SIZE)
      loadingMoreRef.current = false
      setLoadingMore(false)
    }, LOAD_MORE_DELAY_MS)
  }, [])

  useEffect(() => {
    return () => window.clearTimeout(loadMoreTimerRef.current)
  }, [])

  useEffect(() => {
    if (!showList || loadingMore) return
    if (!hasMore && !harvesting) return
    const root = scrollRef.current
    if (root && root.scrollHeight <= root.clientHeight + 48) {
      loadNextPage()
    }
  }, [showList, hasMore, harvesting, loadingMore, visible.length, list.length, loadNextPage])

  useEffect(() => {
    if (!showList) return
    const root = scrollRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadNextPage()
      },
      { root, rootMargin: '160px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [showList, searching, list.length, loadNextPage])

  async function handleSelect(user: User) {
    setStartingId(user._id)
    try {
      await startDirectChat(user._id)
      onStartedChat()
    } finally {
      setStartingId(null)
    }
  }

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-r border-slate-200 bg-white md:w-80 lg:w-[22rem] xl:w-[380px] dark:border-slate-800 dark:bg-slate-950">
      <MobileListHeader
        onViewChange={onViewChange}
        onOpenNav={onOpenNav}
      />
      <div className="hidden px-5 pb-1 pt-5 lg:block">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Members
        </h2>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="rounded-full bg-slate-50 pl-9 dark:bg-slate-900"
            placeholder="Search by name"
            aria-label="Search members"
            {...register('q')}
          />
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {showSpinner ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : null}

        {showError && listError ? (
          <div className="px-2">
            <ErrorBanner
              message={listError}
              onRetry={searching ? undefined : loadMembers}
            />
          </div>
        ) : null}

        {showList && list.length === 0 ? (
          <EmptyState
            icon={<HiOutlineGlobeAlt className="h-6 w-6" />}
            title="No members found"
            description="Try another name."
          />
        ) : null}

        {showList
          ? visible.map((user) => (
              <button
                key={user._id}
                type="button"
                disabled={startingId === user._id}
                onClick={() => void handleSelect(user)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-900"
              >
                <Avatar name={user.name} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {user.phone}
                  </span>
                </span>
              </button>
            ))
          : null}

        {showList && (hasMore || harvesting || loadingMore) ? (
          <div ref={sentinelRef} className="flex justify-center py-3">
            <Spinner className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </aside>
  )
}
