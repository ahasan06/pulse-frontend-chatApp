import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useUserSearch } from '../../hooks/use-user-search'
import { getErrorMessage } from '../../lib/api-error'
import { createGroupSchema, type CreateGroupFormValues } from '../../schemas/group'
import { searchSchema, type SearchFormValues } from '../../schemas/search'
import { useChatStore } from '../../store/chat-store'
import type { User } from '../../types/api'
import { Button } from '../ui/button'
import { Field } from '../ui/field'
import { Input } from '../ui/input'
import { Modal } from '../ui/modal'
import { UserSearchResults } from './user-search-results'

type NewGroupDialogProps = {
  open: boolean
  onClose: () => void
}

export function NewGroupDialog({ open, onClose }: NewGroupDialogProps) {
  const createGroupChat = useChatStore((state) => state.createGroupChat)
  const [members, setMembers] = useState<User[]>([])
  const [serverError, setServerError] = useState('')

  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { q: '' },
  })

  const groupForm = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '', participantIds: [] },
  })

  const query = searchForm.watch('q')
  const { results, status, error } = useUserSearch(query)

  function toggleMember(user: User) {
    const exists = members.some((member) => member._id === user._id)
    const next = exists
      ? members.filter((member) => member._id !== user._id)
      : [...members, user]
    setMembers(next)
    groupForm.setValue(
      'participantIds',
      next.map((member) => member._id),
      { shouldValidate: true },
    )
  }

  async function onSubmit(values: CreateGroupFormValues) {
    setServerError('')
    try {
      await createGroupChat(values.name, values.participantIds)
      groupForm.reset()
      searchForm.reset()
      setMembers([])
      onClose()
    } catch (reason) {
      setServerError(getErrorMessage(reason, 'Could not create the group'))
    }
  }

  return (
    <Modal
      open={open}
      title="New group"
      onClose={onClose}
      footer={
        <Button
          type="submit"
          form="create-group-form"
          className="w-full"
          disabled={groupForm.formState.isSubmitting}
        >
          {groupForm.formState.isSubmitting ? 'Creating…' : 'Create group'}
        </Button>
      }
    >
      <form
        id="create-group-form"
        className="space-y-4"
        onSubmit={groupForm.handleSubmit(onSubmit)}
        noValidate
      >
        <Field label="Group name" error={groupForm.formState.errors.name?.message}>
          <Input
            placeholder="Project Team"
            invalid={Boolean(groupForm.formState.errors.name)}
            {...groupForm.register('name')}
          />
        </Field>
        <Field
          label="Add people"
          error={groupForm.formState.errors.participantIds?.message}
        >
          <Input
            placeholder="Search by name"
            {...searchForm.register('q')}
          />
        </Field>
      </form>

      {members.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {members.map((member) => (
            <button
              key={member._id}
              type="button"
              className="rounded-full bg-mz-out px-3 py-1 text-xs font-medium text-mz-accent-deep"
              onClick={() => toggleMember(member)}
            >
              {member.name} ×
            </button>
          ))}
        </div>
      ) : null}

      {serverError ? (
        <p className="mt-3 text-sm text-red-600">{serverError}</p>
      ) : null}

      <div className="mt-3">
        <UserSearchResults
          query={query}
          results={results}
          status={status}
          error={error}
          selectedIds={members.map((member) => member._id)}
          onSelect={toggleMember}
        />
      </div>
    </Modal>
  )
}
