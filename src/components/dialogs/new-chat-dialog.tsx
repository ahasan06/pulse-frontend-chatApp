import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useUserSearch } from '../../hooks/use-user-search'
import { getErrorMessage } from '../../lib/api-error'
import { searchSchema, type SearchFormValues } from '../../schemas/search'
import { useChatStore } from '../../store/chat-store'
import { Field } from '../ui/field'
import { Input } from '../ui/input'
import { Modal } from '../ui/modal'
import { UserSearchResults } from './user-search-results'
import { useState } from 'react'

type NewChatDialogProps = {
  open: boolean
  onClose: () => void
}

export function NewChatDialog({ open, onClose }: NewChatDialogProps) {
  const startDirectChat = useChatStore((state) => state.startDirectChat)
  const [serverError, setServerError] = useState('')

  const { register, watch } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { q: '' },
  })

  const query = watch('q')
  const { results, status, error } = useUserSearch(query)

  async function handleSelect(userId: string) {
    setServerError('')
    try {
      await startDirectChat(userId)
      onClose()
    } catch (reason) {
      setServerError(getErrorMessage(reason, 'Could not start the chat'))
    }
  }

  return (
    <Modal open={open} title="New chat" onClose={onClose}>
      <Field label="Search people">
        <Input placeholder="Search by name" {...register('q')} />
      </Field>
      {serverError ? (
        <p className="mt-3 text-sm text-red-600">{serverError}</p>
      ) : null}
      <div className="mt-3">
        <UserSearchResults
          query={query}
          results={results}
          status={status}
          error={error}
          onSelect={(user) => void handleSelect(user._id)}
        />
      </div>
    </Modal>
  )
}
