import { create } from 'zustand'
import { chatApi } from '../lib/api'
import { clearToken, getToken, setToken } from '../lib/auth-storage'
import type { User } from '../types/api'

type AuthStatus = 'idle' | 'restoring' | 'ready'

type AuthState = {
  user: User | null
  token: string | null
  status: AuthStatus
  login: (input: { phone: string; name: string }) => Promise<void>
  restoreSession: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getToken(),
  status: 'idle',

  async login(input) {
    const { token, user } = await chatApi.login(input)
    setToken(token)
    set({ token, user, status: 'ready' })
  },

  async restoreSession() {
    const token = getToken()
    if (!token) {
      set({ token: null, user: null, status: 'ready' })
      return
    }

    set({ status: 'restoring', token })

    try {
      const user = await chatApi.me()
      set({ user, token, status: 'ready' })
    } catch {
      clearToken()
      set({ user: null, token: null, status: 'ready' })
    }
  },

  logout() {
    clearToken()
    set({ user: null, token: null, status: 'ready' })
    window.dispatchEvent(new Event('auth:logout'))
  },
}))
