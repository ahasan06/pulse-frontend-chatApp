import { useEffect, useRef, useState } from 'react'
import { HiBell, HiOutlineBell } from 'react-icons/hi2'
import { formatInboxTime } from '../../lib/dates'
import { useChatStore } from '../../store/chat-store'
import { useNotificationStore } from '../../store/notification-store'
import { IconButton } from '../ui/icon-button'

type NotificationBellProps = {
  onOpenChat: () => void
  tone?: 'onDark' | 'onLight'
}

export function NotificationBell({
  onOpenChat,
  tone = 'onDark',
}: NotificationBellProps) {
  const items = useNotificationStore((state) => state.items)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const markConversationRead = useNotificationStore(
    (state) => state.markConversationRead,
  )
  const selectConversation = useChatStore((state) => state.selectConversation)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const count = items.length

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  async function openConversation(conversationId: string) {
    markConversationRead(conversationId)
    onOpenChat()
    setOpen(false)
    await selectConversation(conversationId)
  }

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        label={count > 0 ? `${count} new messages` : 'Notifications'}
        className={
          tone === 'onDark'
            ? 'relative text-white hover:bg-white/10 hover:text-white dark:hover:bg-white/10'
            : 'relative text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
        }
        onClick={() => setOpen((value) => !value)}
      >
        {count > 0 ? (
          <HiBell className={tone === 'onDark' ? 'h-5 w-5 text-white' : 'h-5 w-5'} />
        ) : (
          <HiOutlineBell
            className={tone === 'onDark' ? 'h-5 w-5 text-white' : 'h-5 w-5'}
          />
        )}
        {count > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </IconButton>

      {open ? (
        <div className="absolute top-11 right-0 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 md:left-0 md:right-auto">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Notifications
            </p>
            {count > 0 ? (
              <button
                type="button"
                className="text-xs font-medium text-mz-accent hover:underline"
                onClick={markAllRead}
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {count === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              No new messages
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => void openConversation(item.conversationId)}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatInboxTime(item.createdAt)}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-xs text-slate-500">
                      {item.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
