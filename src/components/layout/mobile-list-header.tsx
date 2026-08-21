import { HiBars3, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import { IconButton } from '../ui/icon-button'
import { NotificationBell } from './notification-bell'
import type { SideNavView } from './side-nav'

type MobileListHeaderProps = {
  onViewChange: (view: SideNavView) => void
  onOpenNav: () => void
}

export function MobileListHeader({
  onViewChange,
  onOpenNav,
}: MobileListHeaderProps) {
  return (
    <header className="flex items-center gap-1 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 lg:hidden sm:px-3">
      <IconButton
        label="Open menu"
        className="text-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        onClick={onOpenNav}
      >
        <HiBars3 className="h-6 w-6" />
      </IconButton>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
        </span>
        <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
          Pulse
        </p>
      </div>
      <NotificationBell
        tone="onLight"
        onOpenChat={() => onViewChange('chats')}
      />
    </header>
  )
}
