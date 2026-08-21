import { useEffect, useState } from 'react'
import { useChatSocket } from '../hooks/use-chat-socket'
import { NewChatDialog } from '../components/dialogs/new-chat-dialog'
import { NewGroupDialog } from '../components/dialogs/new-group-dialog'
import { ChatShell } from '../components/layout/chat-shell'
import type { SideNavView } from '../components/layout/side-nav'
import { useChatStore } from '../store/chat-store'

export function ChatPage() {
  const loadConversations = useChatStore((state) => state.loadConversations)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [view, setView] = useState<SideNavView>('chats')

  useChatSocket()

  useEffect(() => {
    void loadConversations()

    function onLogout() {
      useChatStore.getState().reset()
    }

    window.addEventListener('auth:logout', onLogout)
    return () => {
      window.removeEventListener('auth:logout', onLogout)
    }
  }, [loadConversations])

  return (
    <>
      <ChatShell
        view={view}
        onViewChange={setView}
        onNewChat={() => setNewChatOpen(true)}
        onNewGroup={() => setNewGroupOpen(true)}
      />
      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
      <NewGroupDialog
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
      />
    </>
  )
}
