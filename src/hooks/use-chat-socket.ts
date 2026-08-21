import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { getToken } from '../lib/auth-storage'
import { normalizeMessage } from '../lib/message'
import { useChatStore } from '../store/chat-store'

export function useChatSocket() {
  const applyIncomingMessage = useChatStore((state) => state.applyIncomingMessage)
  const loadConversations = useChatStore((state) => state.loadConversations)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    })

    socket.on('message:new', (payload: unknown) => {
      const message = normalizeMessage(payload)
      if (message) {
        applyIncomingMessage(message)
        return
      }
      void loadConversations()
    })

    socket.on('conversation:updated', () => {
      void loadConversations()
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [applyIncomingMessage, loadConversations])
}
