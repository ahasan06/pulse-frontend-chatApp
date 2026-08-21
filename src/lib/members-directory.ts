import { chatApi } from './api'
import type { User } from '../types/api'

const SEARCH_KEYS = [
  ...'abcdefghijklmnopqrstuvwxyz'.split(''),
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
]

const BATCH_SIZE = 6

let cached: User[] | null = null
let inflight: Promise<User[]> | null = null

function mergeUsers(target: Map<string, User>, users: User[] | undefined) {
  for (const user of users ?? []) {
    target.set(user._id, user)
  }
}

function sorted(users: User[]) {
  return [...users].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
  )
}

async function collectDirectory(onProgress?: (users: User[], done: boolean) => void) {
  const byId = new Map<string, User>()
  mergeUsers(byId, await chatApi.listUsers())
  onProgress?.(sorted([...byId.values()]), false)

  for (let index = 0; index < SEARCH_KEYS.length; index += BATCH_SIZE) {
    const batch = SEARCH_KEYS.slice(index, index + BATCH_SIZE)
    const pages = await Promise.all(
      batch.map((q) => chatApi.searchUsers(q).catch(() => [] as User[])),
    )
    for (const page of pages) mergeUsers(byId, page)
    onProgress?.(sorted([...byId.values()]), false)
  }

  const users = sorted([...byId.values()])
  onProgress?.(users, true)
  return users
}

export function loadMembersDirectory(
  onProgress?: (users: User[], done: boolean) => void,
) {
  if (cached) {
    onProgress?.(cached, true)
    return Promise.resolve(cached)
  }

  if (inflight) {
    return inflight
  }

  inflight = collectDirectory(onProgress)
    .then((users) => {
      cached = users
      inflight = null
      return users
    })
    .catch((error: unknown) => {
      inflight = null
      throw error
    })

  return inflight
}
