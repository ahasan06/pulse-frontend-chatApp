import { useEffect, useRef, useState } from 'react'
import { HiExclamationCircle, HiOutlineClock, HiOutlineSparkles } from 'react-icons/hi2'
import { IoCheckmarkDone } from 'react-icons/io5'
import { translateForReading, type TranslateTarget } from '../../lib/ai-refine'
import { cn } from '../../lib/cn'
import { getSenderName } from '../../lib/conversation'
import { formatMessageTime } from '../../lib/dates'
import { getErrorMessage } from '../../lib/api-error'
import { useAuthStore } from '../../store/auth-store'
import type { Conversation } from '../../types/api'
import type { ClientMessage } from '../../types/chat'
import { Avatar } from '../ui/avatar'
import { Spinner } from '../ui/spinner'

type MessageBubbleProps = {
  message: ClientMessage
  conversation: Conversation
  onRetry: () => void
}

function SendStatus({
  status,
  onRetry,
}: {
  status?: ClientMessage['status']
  onRetry: () => void
}) {
  if (status === 'pending') {
    return (
      <HiOutlineClock className="h-3.5 w-3.5" title="Sending" aria-label="Sending" />
    )
  }

  if (status === 'failed') {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 underline"
        onClick={onRetry}
        title="Failed · tap to retry"
      >
        <HiExclamationCircle className="h-3.5 w-3.5" />
        Retry
      </button>
    )
  }

  return (
    <IoCheckmarkDone
      className="h-4 w-4 text-[#53bdeb]"
      title="Sent"
      aria-label="Sent"
    />
  )
}

export function MessageBubble({
  message,
  conversation,
  onRetry,
}: MessageBubbleProps) {
  const currentUser = useAuthStore((state) => state.user)
  const mine = message.sender === currentUser?._id
  const senderName = getSenderName(conversation, message.sender, currentUser)
  const otherName =
    conversation.type === 'direct'
      ? conversation.participant.name
      : senderName
  const myName = currentUser?.name ?? 'You'
  const [menuOpen, setMenuOpen] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [viewLang, setViewLang] = useState<TranslateTarget | null>(null)
  const [translated, setTranslated] = useState('')
  const [error, setError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setViewLang(null)
    setTranslated('')
    setError('')
    setMenuOpen(false)
  }, [message.text])

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  async function translate(target: TranslateTarget) {
    setMenuOpen(false)
    setTranslating(true)
    setError('')
    try {
      const text = await translateForReading(message.text, target)
      setTranslated(text)
      setViewLang(target)
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not translate this message'))
    } finally {
      setTranslating(false)
    }
  }

  const displayText = viewLang && translated ? translated : message.text
  const canTranslate = Boolean(message.text.trim()) && message.status !== 'pending'

  const sparkleControl = canTranslate ? (
    <div ref={menuRef} className="relative shrink-0 self-center">
      <button
        type="button"
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center text-indigo-500 transition hover:text-indigo-600 dark:text-indigo-300',
          (menuOpen || viewLang) && 'text-indigo-600 dark:text-indigo-200',
          translating && 'pointer-events-none',
        )}
        aria-label="Translate for reading"
        title="Translate"
        disabled={translating}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {translating ? (
          <Spinner className="h-4 w-4 border-indigo-200 border-t-indigo-600" />
        ) : (
          <HiOutlineSparkles className="h-4 w-4" />
        )}
      </button>
      {menuOpen ? (
        <div
          className={cn(
            'absolute z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900',
            mine ? 'right-0 bottom-10' : 'left-0 bottom-10',
          )}
        >
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => void translate('english')}
          >
            Translate to English
          </button>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => void translate('bangla')}
          >
            Translate to Bangla
          </button>
          {viewLang ? (
            <button
              type="button"
              className="flex w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => {
                setViewLang(null)
                setTranslated('')
                setMenuOpen(false)
              }}
            >
              Show original
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  ) : null

  return (
    <div
      className={cn(
        'flex min-w-0 max-w-full items-end gap-1 sm:gap-1.5',
        mine ? 'justify-end' : 'justify-start',
      )}
    >
      {!mine ? (
        <Avatar name={otherName} size="sm" className="mb-0.5 hidden sm:inline-flex" />
      ) : null}
      {mine ? sparkleControl : null}
      <div
        className={cn(
          'relative min-w-0 max-w-[min(100%,calc(100%-2.25rem))] px-2.5 py-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] sm:max-w-[80%] sm:px-3 lg:max-w-[72%]',
          mine
            ? 'msg-tail-out rounded-lg rounded-tr-none bg-[#d9fdd3] text-slate-900 dark:bg-[#005c4b] dark:text-slate-50'
            : 'msg-tail-in rounded-lg rounded-tl-none bg-white text-slate-800 dark:bg-[#202c33] dark:text-slate-100',
        )}
      >
        {!mine && conversation.type === 'group' ? (
          <p className="mb-0.5 text-xs font-semibold text-[#00a884]">{senderName}</p>
        ) : null}
        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed">
          {displayText}
        </p>
        {viewLang ? (
          <p className="mt-1 text-[10px] font-medium text-indigo-500 dark:text-indigo-300">
            {viewLang === 'english' ? 'English' : 'বাংলা'}
          </p>
        ) : null}
        {error ? <p className="mt-1 text-[11px] text-red-600">{error}</p> : null}
        <div
          className={cn(
            'mt-0.5 flex items-center justify-end gap-1 text-[11px]',
            mine
              ? 'text-slate-500 dark:text-emerald-100/70'
              : 'text-slate-400 dark:text-slate-400',
          )}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {mine ? <SendStatus status={message.status} onRetry={onRetry} /> : null}
        </div>
      </div>
      {!mine ? sparkleControl : null}
      {mine ? (
        <Avatar name={myName} size="sm" className="mb-0.5 hidden sm:inline-flex" />
      ) : null}
    </div>
  )
}
