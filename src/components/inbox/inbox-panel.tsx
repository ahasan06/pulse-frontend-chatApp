import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  HiMagnifyingGlass,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import { inboxFilterSchema, type InboxFilterValues } from '../../schemas/search'
import { matchesConversationQuery } from '../../lib/conversation'
import { useChatStore } from '../../store/chat-store'
import { MobileListHeader } from '../layout/mobile-list-header'
import type { SideNavView } from '../layout/side-nav'
import { Button } from '../ui/button'
import { EmptyState } from '../ui/empty-state'
import { ErrorBanner } from '../ui/error-banner'
import { Input } from '../ui/input'
import { Spinner } from '../ui/spinner'
import { ConversationItem } from './conversation-item'

type InboxPanelProps = {
  mode: 'chats' | 'groups'
  onViewChange: (view: SideNavView) => void
  onOpenNav: () => void
  onNewChat: () => void
  onNewGroup: () => void
}

export function InboxPanel({
  mode,
  onViewChange,
  onOpenNav,
  onNewChat,
  onNewGroup,
}: InboxPanelProps) {
  const conversations = useChatStore((state) => state.conversations)
  const status = useChatStore((state) => state.conversationsStatus)
  const error = useChatStore((state) => state.conversationsError)
  const activeId = useChatStore((state) => state.activeId)
  const unreadById = useChatStore((state) => state.unreadById)
  const loadConversations = useChatStore((state) => state.loadConversations)
  const selectConversation = useChatStore((state) => state.selectConversation)
  const groupsOnly = mode === 'groups'

  const { register, watch } = useForm<InboxFilterValues>({
    resolver: zodResolver(inboxFilterSchema),
    defaultValues: { q: '' },
  })

  const query = watch('q')
  const filtered = useMemo(
    () =>
      conversations.filter((item) => {
        if (groupsOnly && item.type !== 'group') return false
        return matchesConversationQuery(item, query)
      }),
    [conversations, groupsOnly, query],
  )

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-r border-slate-200 bg-white md:w-80 lg:w-[22rem] xl:w-[380px] dark:border-mz-border dark:bg-mz-page">
      <MobileListHeader
        onViewChange={onViewChange}
        onOpenNav={onOpenNav}
      />
      <div className="hidden px-5 pb-1 pt-5 lg:block">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {groupsOnly ? 'Groups' : 'Chats'}
        </h2>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="relative">
          <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="rounded-full bg-slate-50 pl-9 dark:bg-slate-900"
            placeholder={
              groupsOnly ? 'Search groups...' : 'Search people or groups...'
            }
            aria-label={groupsOnly ? 'Filter groups' : 'Filter conversations'}
            {...register('q')}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" className="w-full min-w-0 rounded-full px-2 text-xs sm:px-3 sm:text-sm" onClick={onNewChat}>
            + New chat
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="w-full min-w-0 rounded-full border-mz-accent/30 px-2 text-xs text-mz-accent-deep hover:bg-mz-out sm:px-3 sm:text-sm"
            onClick={onNewGroup}
          >
            + New group
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {status === 'loading' ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : null}

        {status === 'error' && error ? (
          <div className="px-2">
            <ErrorBanner message={error} onRetry={() => void loadConversations()} />
          </div>
        ) : null}

        {status === 'ready' && filtered.length === 0 ? (
          <EmptyState
            icon={
              groupsOnly ? (
                <HiOutlineUserGroup className="h-6 w-6" />
              ) : (
                <HiOutlineChatBubbleLeftRight className="h-6 w-6" />
              )
            }
            title={
              query.trim()
                ? 'No matches'
                : groupsOnly
                  ? 'No groups yet'
                  : 'No conversations yet'
            }
            description={
              groupsOnly
                ? 'Use New group to create one.'
                : 'Use New chat to find someone by name or phone.'
            }
          />
        ) : null}

        {status === 'ready'
          ? filtered.map((conversation) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                active={conversation._id === activeId}
                unread={unreadById[conversation._id] ?? 0}
                onSelect={() => void selectConversation(conversation._id)}
              />
            ))
          : null}
      </div>
    </aside>
  )
}
