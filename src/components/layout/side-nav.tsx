import type { ReactNode } from 'react'
import {
  HiArrowRightOnRectangle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineGlobeAlt,
  HiOutlineMoon,
  HiOutlineUserGroup,
  HiOutlineXMark,
} from 'react-icons/hi2'
import { cn } from '../../lib/cn'
import { useAuthStore } from '../../store/auth-store'
import { useThemeStore } from '../../store/theme-store'
import { Avatar } from '../ui/avatar'
import { Switch } from '../ui/switch'
import { BrandMark } from './brand-mark'
import { NotificationBell } from './notification-bell'

export type SideNavView = 'chats' | 'groups' | 'members'

type SideNavProps = {
  view: SideNavView
  onViewChange: (view: SideNavView) => void
  onClose?: () => void
}

export function SideNav({ view, onViewChange, onClose }: SideNavProps) {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <nav className="relative z-20 flex h-full w-60 max-w-[min(15rem,85vw)] shrink-0 flex-col overflow-visible bg-[#0b1426] px-3 py-4">
      <div className="mb-8 flex items-center justify-between gap-2 px-1">
        <BrandMark variant="sidebar" className="px-1" />
        <div className="flex shrink-0 items-center gap-0.5">
          <div className="hidden lg:block">
            <NotificationBell onOpenChat={() => onViewChange('chats')} />
          </div>
          {onClose ? (
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <NavItem
          label="Chats"
          active={view === 'chats'}
          onClick={() => onViewChange('chats')}
        >
          <HiOutlineChatBubbleLeftRight className="h-5 w-5" />
        </NavItem>
        <NavItem
          label="Groups"
          active={view === 'groups'}
          onClick={() => onViewChange('groups')}
        >
          <HiOutlineUserGroup className="h-5 w-5" />
        </NavItem>
        <NavItem
          label="Global members"
          active={view === 'members'}
          onClick={() => onViewChange('members')}
        >
          <HiOutlineGlobeAlt className="h-5 w-5" />
        </NavItem>
      </div>

      <div className="flex flex-col gap-3 pt-3">
        <div className="flex w-full items-center gap-3 px-2.5 py-2 text-sm font-medium text-white">
          <HiOutlineMoon className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1">Night mode</span>
          <Switch
            checked={theme === 'dark'}
            onChange={() => toggleTheme()}
            label="Night mode"
            showLabel={false}
          />
        </div>

        {user ? (
          <div className="flex items-center gap-2.5 px-2 py-1">
            <span className="relative shrink-0">
              <Avatar name={user.name} size="sm" />
              <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-[#0b1426] bg-emerald-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.phone}</p>
            </div>
          </div>
        ) : null}

        <NavItem label="Log out" onClick={logout}>
          <HiArrowRightOnRectangle className="h-5 w-5" />
        </NavItem>
      </div>
    </nav>
  )
}

function NavItem({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm font-medium transition',
        active
          ? 'bg-blue-600 text-white'
          : 'text-white/90 hover:bg-white/10',
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {children}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}
