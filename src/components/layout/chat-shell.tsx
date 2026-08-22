import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import { useChatStore } from '../../store/chat-store'
import { InboxPanel } from '../inbox/inbox-panel'
import { MembersPanel } from '../members/members-panel'
import { ThreadPanel } from '../thread/thread-panel'
import { SideNav, type SideNavView } from './side-nav'

type ChatShellProps = {
  view: SideNavView
  onViewChange: (view: SideNavView) => void
  onNewChat: () => void
  onNewGroup: () => void
}

export function ChatShell({
  view,
  onViewChange,
  onNewChat,
  onNewGroup,
}: ChatShellProps) {
  const activeId = useChatStore((state) => state.activeId)
  const clearActiveConversation = useChatStore(
    (state) => state.clearActiveConversation,
  )
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setNavOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!navOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  function handleViewChange(next: SideNavView) {
    onViewChange(next)
    setNavOpen(false)
  }

  return (
    <div className="flex h-svh overflow-hidden bg-[#eef0f8] dark:bg-mz-page">
      <div className="hidden h-full shrink-0 lg:flex">
        <SideNav view={view} onViewChange={onViewChange} />
      </div>

      {navOpen ? (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/50"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-y-0 left-0 z-50 flex"
          >
            <SideNav
              view={view}
              onViewChange={handleViewChange}
              onClose={() => setNavOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1">
        <div
          className={cn(
            'h-full min-h-0 min-w-0 w-full md:w-auto',
            activeId ? 'hidden md:flex' : 'flex',
          )}
        >
          {view === 'members' ? (
            <MembersPanel
              onViewChange={handleViewChange}
              onOpenNav={() => setNavOpen(true)}
              onStartedChat={() => onViewChange('chats')}
            />
          ) : (
            <InboxPanel
              mode={view === 'groups' ? 'groups' : 'chats'}
              onViewChange={handleViewChange}
              onOpenNav={() => setNavOpen(true)}
              onNewChat={onNewChat}
              onNewGroup={onNewGroup}
            />
          )}
        </div>
        <div
          className={cn(
            'h-full min-w-0 flex-1',
            activeId ? 'flex' : 'hidden md:flex',
          )}
        >
          <ThreadPanel onBack={clearActiveConversation} />
        </div>
      </div>
    </div>
  )
}
