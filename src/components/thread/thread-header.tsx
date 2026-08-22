import { useState } from 'react'
import {
  HiMagnifyingGlass,
  HiOutlineArrowLeft,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import {
  getConversationSubtitle,
  getConversationTitle,
} from '../../lib/conversation'
import type { Conversation } from '../../types/api'
import { Avatar } from '../ui/avatar'
import { IconButton } from '../ui/icon-button'
import { GroupMembersDialog } from '../dialogs/group-members-dialog'

type ThreadHeaderProps = {
  conversation: Conversation
  onBack: () => void
  onSearch: () => void
}

export function ThreadHeader({ conversation, onBack, onSearch }: ThreadHeaderProps) {
  const [membersOpen, setMembersOpen] = useState(false)
  const title = getConversationTitle(conversation)
  const isGroup = conversation.type === 'group'

  return (
    <header className="relative flex items-center gap-2 border-b border-mz-border/20 bg-[#eef0f8] px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-3 sm:px-3 sm:py-2.5 md:px-5 dark:border-mz-border dark:bg-mz-surface">
      <IconButton
        label="Back to chats"
        className="text-slate-600 md:hidden dark:text-slate-300 dark:hover:bg-white/5"
        onClick={onBack}
      >
        <HiOutlineArrowLeft className="h-5 w-5" />
      </IconButton>
      <Avatar name={title} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {getConversationSubtitle(conversation)}
        </p>
      </div>
      <IconButton
        label="Search messages"
        className="text-slate-600 dark:text-slate-300 dark:hover:bg-white/5"
        onClick={onSearch}
      >
        <HiMagnifyingGlass className="h-5 w-5" />
      </IconButton>
      {isGroup ? (
        <IconButton
          label="Group members"
          className="text-slate-600 dark:text-slate-300 dark:hover:bg-white/5"
          onClick={() => setMembersOpen(true)}
        >
          <HiOutlineUserGroup className="h-5 w-5" />
        </IconButton>
      ) : null}

      {isGroup ? (
        <GroupMembersDialog
          open={membersOpen}
          conversation={conversation}
          onClose={() => setMembersOpen(false)}
        />
      ) : null}
    </header>
  )
}
