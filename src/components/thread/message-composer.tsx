import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { HiFaceSmile, HiOutlineSparkles, HiPaperAirplane } from 'react-icons/hi2'
import { refineDraft } from '../../lib/ai-refine'
import { getErrorMessage } from '../../lib/api-error'
import { messageSchema, type MessageFormValues } from '../../schemas/message'
import { useAiComposeStore } from '../../store/ai-compose-store'
import { useChatStore } from '../../store/chat-store'
import { IconButton } from '../ui/icon-button'
import { Spinner } from '../ui/spinner'
import { Switch } from '../ui/switch'
import { Textarea } from '../ui/textarea'
import { EmojiPicker } from './emoji-picker'
import { cn } from '../../lib/cn'

type MessageComposerProps = {
  onSend?: () => void
}

export function MessageComposer({ onSend }: MessageComposerProps) {
  const sendMessage = useChatStore((state) => state.sendMessage)
  const sending = useChatStore((state) => state.sending)
  const banglaToEnglish = useAiComposeStore((state) => state.banglaToEnglish)
  const grammarRefine = useAiComposeStore((state) => state.grammarRefine)
  const setBanglaToEnglish = useAiComposeStore((state) => state.setBanglaToEnglish)
  const setGrammarRefine = useAiComposeStore((state) => state.setGrammarRefine)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [readyToSend, setReadyToSend] = useState(false)
  const [refining, setRefining] = useState(false)
  const [aiError, setAiError] = useState('')
  const lastRefined = useRef('')

  const aiEnabled = banglaToEnglish || grammarRefine

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { text: '' },
  })

  const textField = register('text')

  function markDraftChanged(value: string) {
    if (value.trim() !== lastRefined.current) {
      setReadyToSend(false)
    }
  }

  async function onSubmit(values: MessageFormValues) {
    if (aiEnabled && !readyToSend) return
    setEmojiOpen(false)
    await sendMessage(values.text)
    lastRefined.current = ''
    setReadyToSend(false)
    setAiError('')
    reset({ text: '' })
    onSend?.()
  }

  async function runAiRefine() {
    const text = (getValues('text') ?? '').trim()
    if (!text || !aiEnabled || refining) return

    setRefining(true)
    setEmojiOpen(false)
    setAiError('')
    try {
      const refined = await refineDraft(text, {
        banglaToEnglish,
        grammarRefine,
      })
      lastRefined.current = refined
      setValue('text', refined, { shouldDirty: true, shouldValidate: true })
      setReadyToSend(true)
    } catch (error) {
      setAiError(getErrorMessage(error, 'AI could not refine this message'))
      setReadyToSend(false)
    } finally {
      setRefining(false)
    }
  }

  function insertEmoji(emoji: string) {
    const next = `${getValues('text') ?? ''}${emoji}`
    setValue('text', next, { shouldDirty: true, shouldValidate: true })
    markDraftChanged(next)
  }

  const showAiButton = aiEnabled && !readyToSend

  return (
    <form
      className="shrink-0 border-t border-black/5 bg-[#f0f2f5] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:p-3 dark:border-white/5 dark:bg-[#202c33]"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div
        className={cn(
          'relative flex items-end gap-2 rounded-[24px] px-2 py-1 shadow-sm',
          refining
            ? 'bg-indigo-50 ring-1 ring-indigo-200 dark:bg-indigo-950/50 dark:ring-indigo-800'
            : 'bg-white dark:bg-[#2a3942]',
        )}
        aria-busy={refining}
      >
        {refining ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]">
            <span className="ai-refining-shimmer" />
            <HiOutlineSparkles className="ai-sparkle top-1.5 left-[10%] h-3.5 w-3.5" />
            <HiOutlineSparkles
              className="ai-sparkle top-2.5 left-[38%] h-3 w-3"
              style={{ animationDelay: '0.25s' }}
            />
            <HiOutlineSparkles
              className="ai-sparkle right-[28%] bottom-1.5 h-3.5 w-3.5"
              style={{ animationDelay: '0.45s' }}
            />
            <HiOutlineSparkles
              className="ai-sparkle top-2 right-[12%] h-3 w-3"
              style={{ animationDelay: '0.7s' }}
            />
          </div>
        ) : null}
        <div className="relative">
          <IconButton
            label="Insert emoji"
            className="text-slate-500"
            disabled={refining}
            onClick={() => setEmojiOpen((open) => !open)}
          >
            <HiFaceSmile className="h-5 w-5" />
          </IconButton>
          {emojiOpen && !refining ? <EmojiPicker onSelect={insertEmoji} /> : null}
        </div>
        <Textarea
          rows={1}
          placeholder={refining ? 'AI is refining your message…' : 'Type a message...'}
          invalid={Boolean(errors.text)}
          disabled={refining}
          readOnly={refining}
          className={cn(
            'min-h-9 min-w-0 flex-1 border-0 bg-transparent py-2 shadow-none focus:ring-0',
            refining && 'cursor-not-allowed text-slate-500 dark:text-slate-400',
          )}
          {...textField}
          onChange={(event) => {
            void textField.onChange(event)
            markDraftChanged(event.target.value)
          }}
          onKeyDown={(event) => {
            if (refining) {
              event.preventDefault()
              return
            }
            if (event.key !== 'Enter' || event.shiftKey) return
            event.preventDefault()
            if (showAiButton) {
              void runAiRefine()
              return
            }
            void handleSubmit(onSubmit)()
          }}
        />
        {showAiButton ? (
          <IconButton
            label={refining ? 'AI is refining' : 'Fix with AI'}
            className="h-10 w-10 shrink-0 rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
            disabled={refining}
            onClick={() => void runAiRefine()}
          >
            {refining ? (
              <Spinner className="h-4 w-4 border-white/40 border-t-white" />
            ) : (
              <HiOutlineSparkles className="h-5 w-5" />
            )}
          </IconButton>
        ) : (
          <IconButton
            label="Send"
            className="h-10 w-10 shrink-0 rounded-full bg-[#00a884] text-white hover:bg-[#008f72] hover:text-white"
            disabled={sending || refining}
            type="submit"
          >
            <HiPaperAirplane className="h-5 w-5" />
          </IconButton>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-2 px-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
        <Switch
          checked={banglaToEnglish}
          onChange={(value) => {
            setBanglaToEnglish(value)
            setReadyToSend(false)
          }}
          disabled={refining}
          label="Bangla/Banglish → English"
          hint="Turns Bangla or Banglish in your draft into English. Click the sparkles, check the text, then send."
        />
        <Switch
          checked={grammarRefine}
          onChange={(value) => {
            setGrammarRefine(value)
            setReadyToSend(false)
          }}
          disabled={refining}
          label="Grammar check & refine"
          hint="Fixes spelling, grammar, and wording in your draft. Click the sparkles, check the text, then send."
        />
      </div>

      {errors.text ? (
        <p className="mt-1 px-3 text-xs text-red-600">{errors.text.message}</p>
      ) : null}
      {aiError ? (
        <p className="mt-1 px-1 text-xs text-red-600">{aiError}</p>
      ) : null}
    </form>
  )
}
