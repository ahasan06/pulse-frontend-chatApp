const EMOJIS = [
  '😀',
  '😂',
  '😍',
  '😊',
  '😎',
  '😢',
  '😡',
  '👍',
  '👎',
  '🙏',
  '🔥',
  '💯',
  '🎉',
  '❤️',
  '✨',
  '👏',
  '🤝',
  '✅',
  '👋',
  '🤔',
]

type EmojiPickerProps = {
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="absolute bottom-12 left-0 z-20 grid w-64 max-w-[min(16rem,calc(100vw-1.5rem))] grid-cols-5 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="rounded-lg p-1.5 text-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
