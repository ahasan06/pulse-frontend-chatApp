import { useEffect, useState } from 'react'
import { excludeCurrentUser, usersFromConversations } from '../lib/conversation'
import { nameCaseVariants } from '../lib/phone'
import { chatApi } from '../lib/api'
import { getErrorMessage } from '../lib/api-error'
import { searchSchema } from '../schemas/search'
import { useAuthStore } from '../store/auth-store'
import { useChatStore } from '../store/chat-store'
import type { User } from '../types/api'
import type { LoadStatus } from '../types/chat'
import { useDebouncedValue } from './use-debounced-value'

function mergeUsers(...lists: User[][]) {
  const byId = new Map<string, User>()
  for (const list of lists) {
    for (const user of list) {
      if (user?._id) byId.set(user._id, user)
    }
  }
  return [...byId.values()]
}

function nameMatches(name: string, query: string) {
  return name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
}

export function useUserSearch(query: string) {
  const currentUserId = useAuthStore((state) => state.user?._id)
  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const [results, setResults] = useState<User[]>([])
  const [status, setStatus] = useState<LoadStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const parsed = searchSchema.safeParse({ q: debouncedQuery })
    if (!parsed.success) {
      setResults([])
      setStatus('idle')
      setError(null)
      return
    }

    const raw = parsed.data.q
    let cancelled = false
    setStatus('loading')

    const known = usersFromConversations(useChatStore.getState().conversations)

    Promise.all(
      nameCaseVariants(raw).map((variant) =>
        chatApi.searchUsers(variant).catch(() => [] as User[]),
      ),
    )
      .then((pages) => {
        if (cancelled) return
        const merged = mergeUsers(...pages, known)
        const matched = merged.filter((user) => nameMatches(user.name, raw))
        setResults(excludeCurrentUser(matched, currentUserId))
        setStatus('ready')
        setError(null)
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setStatus('error')
        setError(getErrorMessage(reason, 'Search failed'))
      })

    return () => {
      cancelled = true
    }
  }, [currentUserId, debouncedQuery])

  return { results, status, error }
}
