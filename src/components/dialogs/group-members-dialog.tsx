import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { HiOutlineTrash } from 'react-icons/hi2'
import { useUserSearch } from '../../hooks/use-user-search'
import { getErrorMessage } from '../../lib/api-error'
import { searchSchema, type SearchFormValues } from '../../schemas/search'
import { useAuthStore } from '../../store/auth-store'
import { useChatStore } from '../../store/chat-store'
import type { GroupConversation, User } from '../../types/api'
import { Avatar } from '../ui/avatar'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Modal } from '../ui/modal'
import { UserSearchResults } from './user-search-results'

type GroupMembersDialogProps = {
  open: boolean
  conversation: GroupConversation
  onClose: () => void
}

export function GroupMembersDialog({
  open,
  conversation,
  onClose,
}: GroupMembersDialogProps) {
  const currentUser = useAuthStore((state) => state.user)
  const addGroupMembers = useChatStore((state) => state.addGroupMembers)
  const removeGroupMember = useChatStore((state) => state.removeGroupMember)
  const leaveGroup = useChatStore((state) => state.leaveGroup)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const isAdmin = Boolean(
    currentUser &&
      (conversation.admins?.includes(currentUser._id) ||
        conversation.createdBy === currentUser._id),
  )
  const memberIds = conversation.participants.map((member) => member._id)

  const { register, watch, reset } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { q: '' },
  })
  const query = watch('q')
  const search = useUserSearch(isAdmin && open ? query : '')
  const addable = useMemo(
    () => search.results.filter((user) => !memberIds.includes(user._id)),
    [memberIds, search.results],
  )

  async function handleAdd(user: User) {
    setError('')
    setBusyId(user._id)
    try {
      await addGroupMembers([user._id], conversation._id)
      reset({ q: '' })
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not add this person'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(userId: string) {
    setError('')
    setBusyId(userId)
    try {
      await removeGroupMember(userId, conversation._id)
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not remove this person'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleLeave() {
    setError('')
    setBusyId(currentUser?._id ?? 'leave')
    try {
      await leaveGroup(conversation._id)
      onClose()
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not leave the group'))
      setBusyId(null)
    }
  }

  return (
    <Modal open={open} title={conversation.name} onClose={onClose}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Members · {conversation.participants.length}
      </p>
      <ul className="space-y-2">
        {conversation.participants.map((member) => {
          const admin = conversation.admins?.includes(member._id)
          const isMe = member._id === currentUser?._id
          return (
            <li key={member._id} className="flex items-center gap-2">
              <Avatar name={member.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {member.name}
                  {isMe ? ' (you)' : ''}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {admin ? 'Admin · ' : ''}
                  {member.phone}
                </span>
              </span>
              {isAdmin && !isMe ? (
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label={`Remove ${member.name}`}
                  disabled={busyId === member._id}
                  onClick={() => void handleRemove(member._id)}
                >
                  <HiOutlineTrash className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>

      {isAdmin ? (
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">
            Add people
          </p>
          <Input placeholder="Search by name" {...register('q')} />
          <div className="mt-2">
            <UserSearchResults
              query={query}
              results={addable}
              status={search.status}
              error={search.error}
              onSelect={(user) => {
                if (busyId) return
                void handleAdd(user)
              }}
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4">
        <Button
          variant="ghost"
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
          disabled={Boolean(busyId)}
          onClick={() => void handleLeave()}
        >
          Leave group
        </Button>
      </div>
    </Modal>
  )
}
