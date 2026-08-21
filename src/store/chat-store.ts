import { create } from 'zustand'
import { getConversationTitle, getSenderName } from '../lib/conversation'
import { getErrorMessage } from '../lib/api-error'
import { chatApi } from '../lib/api'
import type { Conversation, Message } from '../types/api'
import type { ClientMessage, LoadStatus } from '../types/chat'
import { useAuthStore } from './auth-store'
import { useNotificationStore } from './notification-store'

type ChatState = {
  conversations: Conversation[]
  conversationsStatus: LoadStatus
  conversationsError: string | null
  activeId: string | null
  messagesById: Record<string, ClientMessage[]>
  hasMoreById: Record<string, boolean>
  unreadById: Record<string, number>
  messagesStatus: LoadStatus
  messagesError: string | null
  loadingOlder: boolean
  sending: boolean
  loadConversations: () => Promise<void>
  selectConversation: (id: string) => Promise<void>
  clearActiveConversation: () => void
  loadOlderMessages: () => Promise<void>
  sendMessage: (text: string) => Promise<void>
  retryMessage: (tempId: string) => Promise<void>
  applyIncomingMessage: (message: Message) => void
  startDirectChat: (userId: string) => Promise<string>
  createGroupChat: (name: string, participantIds: string[]) => Promise<string>
  addGroupMembers: (userIds: string[], conversationId?: string) => Promise<void>
  removeGroupMember: (userId: string, conversationId?: string) => Promise<void>
  leaveGroup: (conversationId?: string) => Promise<void>
  markUnread: (conversationId: string) => void
  markRead: (conversationId: string) => void
  reset: () => void
}

function sortMessages(messages: ClientMessage[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

function bumpConversation(conversations: Conversation[], message: Message) {
  const index = conversations.findIndex((item) => item._id === message.conversation)
  if (index === -1) return conversations

  const current = conversations[index]
  const updated: Conversation = {
    ...current,
    updatedAt: message.createdAt,
    lastMessage: {
      text: message.text,
      sender: message.sender,
      createdAt: message.createdAt,
    },
  }

  return [updated, ...conversations.filter((item) => item._id !== message.conversation)]
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  conversationsStatus: 'idle',
  conversationsError: null,
  activeId: null,
  messagesById: {},
  hasMoreById: {},
  unreadById: {},
  messagesStatus: 'idle',
  messagesError: null,
  loadingOlder: false,
  sending: false,

  async loadConversations() {
    set({ conversationsStatus: 'loading', conversationsError: null })
    try {
      const conversations = await chatApi.listConversations()
      set({
        conversations: conversations ?? [],
        conversationsStatus: 'ready',
      })
    } catch (error) {
      set({
        conversationsStatus: 'error',
        conversationsError: getErrorMessage(error, 'Could not load conversations'),
      })
    }
  },

  async selectConversation(id) {
    set({
      activeId: id,
      messagesStatus: 'loading',
      messagesError: null,
      unreadById: { ...get().unreadById, [id]: 0 },
    })

    try {
      const page = await chatApi.getMessages(id, { limit: 20 })
      useNotificationStore.getState().markConversationRead(id)
      set({
        messagesById: {
          ...get().messagesById,
          [id]: sortMessages(page.messages),
        },
        hasMoreById: {
          ...get().hasMoreById,
          [id]: page.hasMore,
        },
        messagesStatus: 'ready',
      })
    } catch (error) {
      set({
        messagesStatus: 'error',
        messagesError: getErrorMessage(error, 'Could not load messages'),
      })
    }
  },

  clearActiveConversation() {
    set({ activeId: null, messagesStatus: 'idle', messagesError: null })
  },

  async loadOlderMessages() {
    const { activeId, messagesById, hasMoreById, loadingOlder } = get()
    if (!activeId || loadingOlder || !hasMoreById[activeId]) return

    const oldest = messagesById[activeId]?.[0]
    if (!oldest) return

    set({ loadingOlder: true })
    try {
      const page = await chatApi.getMessages(activeId, {
        limit: 20,
        before: oldest._id,
      })
      const merged = sortMessages([
        ...page.messages,
        ...(get().messagesById[activeId] ?? []),
      ]).filter(
        (message, index, list) =>
          list.findIndex((item) => item._id === message._id) === index,
      )

      set({
        messagesById: { ...get().messagesById, [activeId]: merged },
        hasMoreById: { ...get().hasMoreById, [activeId]: page.hasMore },
        loadingOlder: false,
      })
    } catch {
      set({ loadingOlder: false })
    }
  },

  async sendMessage(text) {
    const conversationId = get().activeId
    const user = useAuthStore.getState().user
    if (!conversationId || !user) return

    const tempId = `temp-${crypto.randomUUID()}`
    const optimistic: ClientMessage = {
      _id: tempId,
      conversation: conversationId,
      sender: user._id,
      text,
      createdAt: new Date().toISOString(),
      status: 'pending',
    }

    set({
      sending: true,
      messagesById: {
        ...get().messagesById,
        [conversationId]: [...(get().messagesById[conversationId] ?? []), optimistic],
      },
    })

    try {
      const saved = await chatApi.sendMessage({ conversationId, text })
      const current = get().messagesById[conversationId] ?? []
      const withoutTemp = current.filter((item) => item._id !== tempId)
      const next = withoutTemp.some((item) => item._id === saved._id)
        ? withoutTemp
        : [...withoutTemp, { ...saved, status: 'sent' as const }]

      set({
        sending: false,
        messagesById: {
          ...get().messagesById,
          [conversationId]: sortMessages(next),
        },
        conversations: bumpConversation(get().conversations, saved),
      })
    } catch {
      set({
        sending: false,
        messagesById: {
          ...get().messagesById,
          [conversationId]: (get().messagesById[conversationId] ?? []).map((item) =>
            item._id === tempId ? { ...item, status: 'failed' } : item,
          ),
        },
      })
    }
  },

  async retryMessage(tempId) {
    const conversationId = get().activeId
    if (!conversationId) return
    const pending = (get().messagesById[conversationId] ?? []).find(
      (item) => item._id === tempId,
    )
    if (!pending) return

    set({
      messagesById: {
        ...get().messagesById,
        [conversationId]: (get().messagesById[conversationId] ?? []).map((item) =>
          item._id === tempId ? { ...item, status: 'pending' } : item,
        ),
      },
    })

    try {
      const saved = await chatApi.sendMessage({
        conversationId,
        text: pending.text,
      })
      set({
        messagesById: {
          ...get().messagesById,
          [conversationId]: sortMessages(
            (get().messagesById[conversationId] ?? [])
              .filter((item) => item._id !== tempId)
              .concat({ ...saved, status: 'sent' }),
          ),
        },
        conversations: bumpConversation(get().conversations, saved),
      })
    } catch {
      set({
        messagesById: {
          ...get().messagesById,
          [conversationId]: (get().messagesById[conversationId] ?? []).map((item) =>
            item._id === tempId ? { ...item, status: 'failed' } : item,
          ),
        },
      })
    }
  },

  applyIncomingMessage(message) {
    if (!message?._id || !message.conversation) return

    const { activeId, messagesById, conversations } = get()
    const isActive = activeId === message.conversation
    const existing = messagesById[message.conversation]
    const thread = existing ?? (isActive ? [] : undefined)

    if (thread) {
      const alreadySaved = thread.some((item) => item._id === message._id)
      if (!alreadySaved) {
        const withoutMatchingTemp = thread.filter(
          (item) =>
            !(
              item.status === 'pending' &&
              item.text === message.text &&
              item.sender === message.sender
            ),
        )
        set({
          messagesById: {
            ...get().messagesById,
            [message.conversation]: sortMessages([
              ...withoutMatchingTemp,
              { ...message, status: 'sent' },
            ]),
          },
        })
      }
    }

    const nextConversations = bumpConversation(get().conversations, message)
    const currentUserId = useAuthStore.getState().user?._id
    const fromOther = message.sender !== currentUserId

    set({
      conversations: nextConversations,
      unreadById:
        !isActive && fromOther
          ? {
              ...get().unreadById,
              [message.conversation]: (get().unreadById[message.conversation] ?? 0) + 1,
            }
          : get().unreadById,
    })

    if (fromOther && !isActive) {
      const conversation =
        nextConversations.find((item) => item._id === message.conversation) ??
        conversations.find((item) => item._id === message.conversation)
      const currentUser = useAuthStore.getState().user
      const title = conversation
        ? conversation.type === 'group'
          ? `${getSenderName(conversation, message.sender, currentUser)} · ${conversation.name}`
          : getConversationTitle(conversation)
        : 'New message'

      useNotificationStore.getState().addIncoming({
        id: message._id,
        conversationId: message.conversation,
        title,
        text: message.text,
        createdAt: message.createdAt,
      })
    }

    if (!conversations.some((item) => item._id === message.conversation)) {
      void get().loadConversations()
    }
  },

  async startDirectChat(userId) {
    const existing = get().conversations.find(
      (item) => item.type === 'direct' && item.participant._id === userId,
    )
    if (existing) {
      await get().selectConversation(existing._id)
      return existing._id
    }

    const created = await chatApi.startDirectConversation(userId)
    await get().loadConversations()
    await get().selectConversation(created._id)
    return created._id
  },

  async createGroupChat(name, participantIds) {
    const created = (await chatApi.createGroup({ name, participantIds })) as {
      _id?: string
    }
    await get().loadConversations()
    if (created?._id) {
      await get().selectConversation(created._id)
      return created._id
    }
    return get().activeId ?? ''
  },

  async addGroupMembers(userIds, conversationId) {
    const id = conversationId ?? get().activeId
    if (!id || userIds.length === 0) return
    await chatApi.addParticipants(id, userIds)
    await get().loadConversations()
  },

  async removeGroupMember(userId, conversationId) {
    const id = conversationId ?? get().activeId
    if (!id) return
    await chatApi.removeParticipant(id, userId)
    await get().loadConversations()
  },

  async leaveGroup(conversationId) {
    const id = conversationId ?? get().activeId
    const userId = useAuthStore.getState().user?._id
    if (!id || !userId) return
    await chatApi.removeParticipant(id, userId)
    if (get().activeId === id) {
      get().clearActiveConversation()
    }
    await get().loadConversations()
  },

  markUnread(conversationId) {
    set({
      unreadById: {
        ...get().unreadById,
        [conversationId]: Math.max(1, get().unreadById[conversationId] ?? 0),
      },
    })
  },

  markRead(conversationId) {
    useNotificationStore.getState().markConversationRead(conversationId)
    set({
      unreadById: { ...get().unreadById, [conversationId]: 0 },
    })
  },

  reset() {
    set({
      conversations: [],
      conversationsStatus: 'idle',
      conversationsError: null,
      activeId: null,
      messagesById: {},
      hasMoreById: {},
      unreadById: {},
      messagesStatus: 'idle',
      messagesError: null,
      loadingOlder: false,
      sending: false,
    })
    useNotificationStore.getState().reset()
  },
}))

export function getActiveConversation(state: ChatState) {
  return state.conversations.find((item) => item._id === state.activeId)
}
