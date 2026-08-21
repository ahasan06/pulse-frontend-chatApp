import type { ReactNode } from 'react'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function highlightText(text: string, query: string): ReactNode {
  const needle = query.trim()
  if (!needle) return text

  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'))
  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <mark
        key={`${part}-${index}`}
        className="rounded-sm bg-blue-200 text-slate-900 dark:bg-blue-500/50 dark:text-slate-50"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  )
}
