import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  HiChevronDown,
  HiOutlineClipboard,
  HiOutlineArrowRightOnRectangle,
  HiOutlineEnvelope,
  HiOutlineEnvelopeOpen,
  HiOutlineUserGroup,
  HiOutlineUserPlus,
} from 'react-icons/hi2'
import { cn } from '../../lib/cn'
import {
  getConversationPreview,
  getConversationTimestamp,
  getConversationTitle,
} from '../../lib/conversation'
import { getErrorMessage } from '../../lib/api-error'
import { formatInboxTime } from '../../lib/dates'
import { isLastMessagePreview, type Conversation } from '../../types/api'
import { useChatStore } from '../../store/chat-store'
import { AddMemberDialog } from '../dialogs/add-member-dialog'
import { Avatar } from '../ui/avatar'

type ConversationItemProps = {
  conversation: Conversation
  active: boolean
  unread: number
  onSelect: () => void
}

export function ConversationItem({
  conversation,
  active,
  unread,
  onSelect,
}: ConversationItemProps) {
  const title = getConversationTitle(conversation)
  const preview = getConversationPreview(conversation)
  const timestamp = getConversationTimestamp(conversation)
  const hasPreview = isLastMessagePreview(conversation.lastMessage)
  const isGroup = conversation.type === 'group'
  const markUnread = useChatStore((state) => state.markUnread)
  const markRead = useChatStore((state) => state.markRead)
  const leaveGroup = useChatStore((state) => state.leaveGroup)
  const [menuOpen, setMenuOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const chevronRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      setMenuOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const menuHeight = 200
    const openUp = window.innerHeight - rect.bottom < menuHeight
    setMenuPos({
      top: openUp ? rect.top - menuHeight : rect.bottom + 4,
      right: window.innerWidth - rect.right,
    })
    setError('')
    setMenuOpen((open) => !open)
  }

  async function copyLastMessage() {
    if (!isLastMessagePreview(conversation.lastMessage)) return
    await navigator.clipboard.writeText(conversation.lastMessage.text)
    setMenuOpen(false)
  }

  async function handleLeave() {
    setLeaving(true)
    setError('')
    try {
      await leaveGroup(conversation._id)
      setMenuOpen(false)
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not leave this group'))
    } finally {
      setLeaving(false)
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition',
        active ? 'bg-mz-out dark:bg-mz-accent/15' : 'hover:bg-slate-50 dark:hover:bg-mz-elevated',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="relative">
          <Avatar name={title} />
          {isGroup ? (
            <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5 text-mz-accent dark:bg-mz-page">
              <HiOutlineUserGroup className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </p>
            <span className="shrink-0 text-xs text-slate-400">
              {formatInboxTime(timestamp)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className="truncate text-sm text-slate-500">{preview}</p>
            <div className="flex shrink-0 items-center gap-0.5">
              {unread > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-mz-accent px-1.5 text-[11px] font-semibold text-white">
                  {unread}
                </span>
              ) : null}
              {isGroup ? <span className="inline-flex h-6 w-6" /> : null}
            </div>
          </div>
        </div>
      </button>

      {isGroup ? (
        <button
          ref={chevronRef}
          type="button"
          aria-label="Group options"
          aria-expanded={menuOpen}
          className="absolute right-2 bottom-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/80 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          onClick={openMenu}
        >
          <HiChevronDown className={cn('h-4 w-4 transition', menuOpen && 'rotate-180')} />
        </button>
      ) : null}

      {menuOpen
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: menuPos.top, right: menuPos.right }}
              className="fixed z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              {unread > 0 ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => {
                    markRead(conversation._id)
                    setMenuOpen(false)
                  }}
                >
                  <HiOutlineEnvelopeOpen className="h-4 w-4" />
                  Mark as read
                </button>
              ) : (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => {
                    markUnread(conversation._id)
                    setMenuOpen(false)
                  }}
                >
                  <HiOutlineEnvelope className="h-4 w-4" />
                  Mark as unread
                </button>
              )}
              {hasPreview ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => void copyLastMessage()}
                >
                  <HiOutlineClipboard className="h-4 w-4" />
                  Copy last message
                </button>
              ) : null}
              {isGroup ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => {
                    setMenuOpen(false)
                    setAddOpen(true)
                  }}
                >
                  <HiOutlineUserPlus className="h-4 w-4" />
                  Add member
                </button>
              ) : null}
              {isGroup ? (
                <button
                  type="button"
                  disabled={leaving}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
                  onClick={() => void handleLeave()}
                >
                  <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
                  {leaving ? 'Leaving…' : 'Leave group'}
                </button>
              ) : null}
              {error ? <p className="px-3 py-1.5 text-xs text-red-600">{error}</p> : null}
            </div>,
            document.body,
          )
        : null}

      {conversation.type === 'group' ? (
        <AddMemberDialog
          open={addOpen}
          conversation={conversation}
          onClose={() => setAddOpen(false)}
        />
      ) : null}
    </div>
  )
}
