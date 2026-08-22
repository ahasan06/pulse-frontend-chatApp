import { HiBars3 } from 'react-icons/hi2'
import { IconButton } from '../ui/icon-button'
import { BrandMark } from './brand-mark'
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
      <BrandMark className="min-w-0 flex-1" />
      <NotificationBell
        tone="onLight"
        onOpenChat={() => onViewChange('chats')}
      />
    </header>
  )
}
