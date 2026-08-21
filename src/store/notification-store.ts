import { create } from 'zustand'

export type ChatNotification = {
  id: string
  conversationId: string
  title: string
  text: string
  createdAt: string
}

type NotificationState = {
  items: ChatNotification[]
  addIncoming: (item: ChatNotification) => void
  markConversationRead: (conversationId: string) => void
  markAllRead: () => void
  reset: () => void
}

const MAX_ITEMS = 40

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],

  addIncoming(item) {
    if (get().items.some((existing) => existing.id === item.id)) return
    set({
      items: [item, ...get().items].slice(0, MAX_ITEMS),
    })
  },

  markConversationRead(conversationId) {
    set({
      items: get().items.filter((item) => item.conversationId !== conversationId),
    })
  },

  markAllRead() {
    set({ items: [] })
  },

  reset() {
    set({ items: [] })
  },
}))
