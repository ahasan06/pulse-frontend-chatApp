export type User = {
  _id: string
  name: string
  phone: string
  createdAt?: string
}

export type LastMessagePreview = {
  text: string
  sender: string
  createdAt: string
}

export type Message = {
  _id: string
  conversation: string
  sender: string
  text: string
  createdAt: string
}

export type DirectConversation = {
  _id: string
  type: 'direct'
  updatedAt: string
  lastMessage?: LastMessagePreview | Record<string, never>
  participant: User
}

export type GroupConversation = {
  _id: string
  type: 'group'
  name: string
  updatedAt: string
  lastMessage?: LastMessagePreview | Record<string, never>
  createdBy: string
  admins: string[]
  participants: User[]
}

export type Conversation = DirectConversation | GroupConversation

export type LoginRequest = {
  phone: string
  name: string
}

export type LoginResponse = {
  token: string
  user: User
}

export type StartDirectResponse = {
  _id: string
  participants: string[]
  createdAt: string
}

export type MessagesPage = {
  messages: Message[]
  hasMore: boolean
}

export type CreateGroupRequest = {
  name: string
  participantIds: string[]
}

export type SendMessageRequest = {
  conversationId: string
  text: string
}

export type ApiErrorBody = {
  error?: {
    message?: string
    code?: string
  }
}

export function isLastMessagePreview(
  value: DirectConversation['lastMessage'],
): value is LastMessagePreview {
  return Boolean(value && 'text' in value && value.text)
}
