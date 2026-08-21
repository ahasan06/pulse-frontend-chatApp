import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'chatapp.theme'

function readTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  return saved === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

type ThemeState = {
  theme: Theme
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  toggleTheme() {
    const theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, theme)
    applyTheme(theme)
    set({ theme })
  },
}))

export function initTheme() {
  const theme = readTheme()
  applyTheme(theme)
  useThemeStore.setState({ theme })
}
