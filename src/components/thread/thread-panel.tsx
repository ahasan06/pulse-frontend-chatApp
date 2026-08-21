import { useEffect, useRef, useState } from 'react'
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import { cn } from '../../lib/cn'
import { useAutoScroll } from '../../hooks/use-auto-scroll'
import { formatDayLabel, getDayKey } from '../../lib/dates'
import { getActiveConversation, useChatStore } from '../../store/chat-store'
import { EMPTY_MESSAGES } from '../../types/chat'
import { EmptyState } from '../ui/empty-state'
import { ErrorBanner } from '../ui/error-banner'
import { Spinner } from '../ui/spinner'
import { MessageBubble } from './message-bubble'
import { MessageComposer } from './message-composer'
import { MessageSearchPanel } from './message-search-panel'
import { ThreadHeader } from './thread-header'

const OLDER_PAGE_DELAY_MS = 2000

type ThreadPanelProps = {
  onBack: () => void
}

export function ThreadPanel({ onBack }: ThreadPanelProps) {
  const conversation = useChatStore(getActiveConversation)
  const activeId = useChatStore((state) => state.activeId)
  const messages = useChatStore(
    (state) =>
      (state.activeId && state.messagesById[state.activeId]) || EMPTY_MESSAGES,
  )
  const status = useChatStore((state) => state.messagesStatus)
  const error = useChatStore((state) => state.messagesError)
  const hasMore = useChatStore((state) =>
    activeId ? Boolean(state.hasMoreById[activeId]) : false,
  )
  const loadingOlder = useChatStore((state) => state.loadingOlder)
  const loadOlderMessages = useChatStore((state) => state.loadOlderMessages)
  const retryMessage = useChatStore((state) => state.retryMessage)
  const selectConversation = useChatStore((state) => state.selectConversation)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [olderSpinner, setOlderSpinner] = useState(false)
  const olderLock = useRef(false)

  const lastMessageId = messages.at(-1)?._id
  const { ref, onScroll, scrollToBottom, showJump } = useAutoScroll(
    lastMessageId,
    activeId,
  )

  useEffect(() => {
    setSearchOpen(false)
    setSearchQuery('')
    setFocusedId(null)
    setOlderSpinner(false)
    olderLock.current = false
  }, [activeId])

  useEffect(() => {
    if (!focusedId) return
    const timer = window.setTimeout(() => setFocusedId(null), 1600)
    return () => window.clearTimeout(timer)
  }, [focusedId])

  if (!conversation) {
    return (
      <section className="chat-wallpaper relative hidden h-full flex-1 items-center justify-center md:flex">
        <EmptyState
          icon={<HiOutlineChatBubbleLeftRight className="h-6 w-6" />}
          title="Select a conversation"
          description="Choose a chat from the left, or start a new one."
        />
      </section>
    )
  }

  async function handleScroll() {
    onScroll()
    const element = ref.current
    if (!element || olderLock.current || loadingOlder || !hasMore) return
    if (element.scrollTop >= 80) return

    olderLock.current = true
    setOlderSpinner(true)
    const previousHeight = element.scrollHeight
    const startedAt = Date.now()
    const conversationId = activeId

    await loadOlderMessages()

    const wait = Math.max(0, OLDER_PAGE_DELAY_MS - (Date.now() - startedAt))
    if (wait > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, wait))
    }

    requestAnimationFrame(() => {
      if (ref.current && useChatStore.getState().activeId === conversationId) {
        ref.current.scrollTop = ref.current.scrollHeight - previousHeight
      }
      setOlderSpinner(false)
      olderLock.current = false
    })
  }

  function jumpToMessage(messageId: string) {
    setFocusedId(messageId)
    document.getElementById(`msg-${messageId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  return (
    <section className="relative flex h-full min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col bg-[#efeae2] dark:bg-[#0b141a]">
        <ThreadHeader
          conversation={conversation}
          onBack={onBack}
          onSearch={() => setSearchOpen(true)}
        />

        <div className="relative min-h-0 flex-1">
          <div className="chat-wallpaper pointer-events-none absolute inset-0" />
          <div
            ref={ref}
            onScroll={() => void handleScroll()}
            className="relative z-[1] h-full space-y-1 overflow-x-hidden overflow-y-auto px-3 py-4 md:px-10"
          >
          {status === 'loading' ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : null}

          {status === 'error' && error ? (
            <ErrorBanner
              message={error}
              onRetry={() => void selectConversation(conversation._id)}
            />
          ) : null}

          {status === 'ready' && messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Say hello to start the conversation."
            />
          ) : null}

          {olderSpinner || loadingOlder ? (
            <div className="flex justify-center py-3">
              <Spinner className="h-4 w-4" />
            </div>
          ) : null}

          {messages.map((message, index) => {
            const previous = messages[index - 1]
            const showDay =
              !previous || getDayKey(previous.createdAt) !== getDayKey(message.createdAt)

            return (
              <div
                key={message._id}
                id={`msg-${message._id}`}
                className={cn(
                  'rounded-lg transition',
                  focusedId === message._id && 'bg-[#fff5c4]/70 dark:bg-white/10',
                )}
              >
                {showDay ? (
                  <div className="mb-3 flex justify-center pt-2">
                    <span className="rounded-full bg-[#e1f2fa] px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:bg-[#182229] dark:text-slate-300">
                      {formatDayLabel(message.createdAt)}
                    </span>
                  </div>
                ) : null}
                <MessageBubble
                  message={message}
                  conversation={conversation}
                  onRetry={() => void retryMessage(message._id)}
                />
              </div>
            )
          })}
          </div>

          {showJump && status === 'ready' && messages.length > 0 ? (
            <button
              type="button"
              className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#00a884] px-3 py-1 text-xs font-medium text-white shadow-md"
              onClick={scrollToBottom}
            >
              New messages
            </button>
          ) : null}
        </div>

        <MessageComposer onSend={scrollToBottom} />
      </div>

      {searchOpen ? (
        <MessageSearchPanel
          messages={messages}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onClose={() => {
            setSearchOpen(false)
            setSearchQuery('')
          }}
          onSelect={jumpToMessage}
        />
      ) : null}
    </section>
  )
}
