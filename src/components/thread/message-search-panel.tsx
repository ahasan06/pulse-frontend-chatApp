import { useEffect, useMemo, useRef } from 'react'
import { HiMagnifyingGlass, HiXMark } from 'react-icons/hi2'
import { formatSearchGroupLabel, getDayKey } from '../../lib/dates'
import { highlightText } from '../../lib/highlight'
import type { ClientMessage } from '../../types/chat'
import { IconButton } from '../ui/icon-button'
import { Input } from '../ui/input'

type MessageSearchPanelProps = {
  messages: ClientMessage[]
  query: string
  onQueryChange: (query: string) => void
  onClose: () => void
  onSelect: (messageId: string) => void
}

export function MessageSearchPanel({
  messages,
  query,
  onQueryChange,
  onClose,
  onSelect,
}: MessageSearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const needle = query.trim().toLowerCase()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const groups = useMemo(() => {
    if (!needle) return []

    const matches = [...messages]
      .filter((message) => message.text.toLowerCase().includes(needle))
      .reverse()

    const grouped: { key: string; label: string; messages: ClientMessage[] }[] = []
    for (const message of matches) {
      const key = getDayKey(message.createdAt)
      const last = grouped.at(-1)
      if (last?.key === key) {
        last.messages.push(message)
      } else {
        grouped.push({
          key,
          label: formatSearchGroupLabel(message.createdAt),
          messages: [message],
        })
      }
    }
    return grouped
  }, [messages, needle])

  const matchCount = groups.reduce((sum, group) => sum + group.messages.length, 0)

  return (
    <aside className="flex h-full w-full min-w-0 shrink-0 flex-col border-l border-slate-200 bg-white max-lg:absolute max-lg:inset-0 max-lg:z-30 lg:w-96 dark:border-slate-800 dark:bg-slate-950">
      <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-3 dark:border-slate-800">
        <IconButton label="Close search" onClick={onClose}>
          <HiXMark className="h-5 w-5" />
        </IconButton>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Search messages
        </h2>
      </header>

      <div className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
        <div className="relative">
          <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-10 rounded-full bg-slate-50 pl-9 pr-9 dark:bg-slate-900"
            placeholder="Search…"
            aria-label="Search messages in this chat"
          />
          {query ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800"
              aria-label="Clear search"
              onClick={() => {
                onQueryChange('')
                inputRef.current?.focus()
              }}
            >
              <HiXMark className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {!needle ? (
          <p className="px-2 py-8 text-center text-sm text-slate-500">
            Search for messages in this chat.
          </p>
        ) : matchCount === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-slate-500">
            No messages found
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.key}>
                <h3 className="mb-1 px-1 text-xs font-medium text-slate-400">
                  {group.label}
                </h3>
                <ul>
                  {group.messages.map((message) => (
                    <li key={message._id}>
                      <button
                        type="button"
                        className="w-full rounded-lg px-2 py-2 text-left text-sm leading-relaxed text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={() => onSelect(message._id)}
                      >
                        {highlightText(message.text, query)}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
