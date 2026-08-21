import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUserSearch } from '../../hooks/use-user-search'
import { getErrorMessage } from '../../lib/api-error'
import { searchSchema, type SearchFormValues } from '../../schemas/search'
import { useAuthStore } from '../../store/auth-store'
import { useChatStore } from '../../store/chat-store'
import type { GroupConversation, User } from '../../types/api'
import { Input } from '../ui/input'
import { Modal } from '../ui/modal'
import { UserSearchResults } from './user-search-results'

type AddMemberDialogProps = {
  open: boolean
  conversation: GroupConversation
  onClose: () => void
}

export function AddMemberDialog({
  open,
  conversation,
  onClose,
}: AddMemberDialogProps) {
  const currentUser = useAuthStore((state) => state.user)
  const liveConversation = useChatStore((state) =>
    state.conversations.find((item) => item._id === conversation._id),
  )
  const group =
    liveConversation?.type === 'group' ? liveConversation : conversation
  const addGroupMembers = useChatStore((state) => state.addGroupMembers)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const isAdmin = Boolean(
    currentUser &&
      (group.admins?.includes(currentUser._id) ||
        group.createdBy === currentUser._id),
  )
  const memberIds = group.participants.map((member) => member._id)

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
    if (!isAdmin || busyId) return
    setError('')
    setBusyId(user._id)
    try {
      await addGroupMembers([user._id], group._id)
      reset({ q: '' })
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not add this person'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Modal open={open} title={`Add member · ${group.name}`} onClose={onClose}>
      {isAdmin ? (
        <>
          <p className="mb-3 text-sm text-slate-500">
            Search by name, then click someone to add them to this group.
          </p>
          <Input placeholder="Search by name" {...register('q')} />
          <div className="mt-2">
            <UserSearchResults
              query={query}
              results={addable}
              status={search.status}
              error={search.error}
              onSelect={(user) => void handleAdd(user)}
            />
          </div>
        </>
      ) : (
        <p className="py-6 text-center text-sm text-slate-500">
          Only group admins can add members.
        </p>
      )}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </Modal>
  )
}
