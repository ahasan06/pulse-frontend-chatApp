import { phonesMatch } from './phone'
import type { Conversation, User } from '../types/api'
import { isLastMessagePreview } from '../types/api'

export function getConversationTitle(conversation: Conversation) {
  return conversation.type === 'group'
    ? conversation.name
    : conversation.participant.name
}

export function getConversationSubtitle(conversation: Conversation) {
  if (conversation.type === 'direct') {
    return conversation.participant.phone
  }
  return `${conversation.participants.length} members`
}

export function getConversationPreview(conversation: Conversation) {
  if (isLastMessagePreview(conversation.lastMessage)) {
    return conversation.lastMessage.text
  }
  return 'No messages yet'
}

export function getConversationTimestamp(conversation: Conversation) {
  if (isLastMessagePreview(conversation.lastMessage)) {
    return conversation.lastMessage.createdAt
  }
  return conversation.updatedAt
}

export function getSenderName(
  conversation: Conversation | undefined,
  senderId: string,
  currentUser: User | null,
) {
  if (currentUser && senderId === currentUser._id) return 'You'
  if (!conversation) return 'Unknown'

  if (conversation.type === 'direct') {
    return conversation.participant._id === senderId
      ? conversation.participant.name
      : (currentUser?.name ?? 'Unknown')
  }

  return (
    conversation.participants.find((member) => member._id === senderId)?.name ??
    'Unknown'
  )
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function matchesConversationQuery(conversation: Conversation, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true

  if (conversation.type === 'direct') {
    const person = conversation.participant
    return (
      person.name.toLowerCase().includes(needle) ||
      phonesMatch(person.phone, query)
    )
  }

  if (conversation.name.toLowerCase().includes(needle)) return true
  return conversation.participants.some(
    (member) =>
      member.name.toLowerCase().includes(needle) ||
      phonesMatch(member.phone, query),
  )
}

export function usersFromConversations(conversations: Conversation[]): User[] {
  const byId = new Map<string, User>()
  for (const item of conversations) {
    if ('participant' in item && item.participant?._id) {
      byId.set(item.participant._id, item.participant)
    }
    if ('participants' in item && Array.isArray(item.participants)) {
      for (const member of item.participants) {
        if (member?._id) byId.set(member._id, member)
      }
    }
  }
  return [...byId.values()]
}

export function getConversationMembers(
  conversation: Conversation,
  currentUser: User | null,
): User[] {
  if (conversation.type === 'direct') {
    const other = conversation.participant
    if (!currentUser || currentUser._id === other._id) return [other]
    return [currentUser, other]
  }
  return conversation.participants
}

export function excludeCurrentUser(users: User[], currentUserId?: string) {
  if (!currentUserId) return users
  return users.filter((user) => user._id !== currentUserId)
}
