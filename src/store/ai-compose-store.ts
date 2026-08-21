import { create } from 'zustand'

const STORAGE_KEY = 'chatapp.ai-compose'

type SavedModes = {
  banglaToEnglish: boolean
  grammarRefine: boolean
}

function readModes(): SavedModes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { banglaToEnglish: false, grammarRefine: false }
    const parsed = JSON.parse(raw) as Partial<SavedModes>
    return {
      banglaToEnglish: Boolean(parsed.banglaToEnglish),
      grammarRefine: Boolean(parsed.grammarRefine),
    }
  } catch {
    return { banglaToEnglish: false, grammarRefine: false }
  }
}

function saveModes(modes: SavedModes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(modes))
}

type AiComposeState = SavedModes & {
  setBanglaToEnglish: (value: boolean) => void
  setGrammarRefine: (value: boolean) => void
}

export const useAiComposeStore = create<AiComposeState>((set, get) => ({
  ...readModes(),
  setBanglaToEnglish(value) {
    saveModes({ banglaToEnglish: value, grammarRefine: get().grammarRefine })
    set({ banglaToEnglish: value })
  },
  setGrammarRefine(value) {
    saveModes({ banglaToEnglish: get().banglaToEnglish, grammarRefine: value })
    set({ grammarRefine: value })
  },
}))
