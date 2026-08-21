import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/protected-route'
import { ChatPage } from './pages/chat-page'
import { LoginPage } from './pages/login-page'
import { useAuthStore } from './store/auth-store'

function SessionGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)
  const restoreSession = useAuthStore((state) => state.restoreSession)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  useEffect(() => {
    function onUnauthorized() {
      logout()
    }

    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
  }, [logout])

  if (status !== 'ready') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950">
        Restoring session…
      </div>
    )
  }

  return children
}

function App() {
  return (
    <SessionGate>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<ChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </SessionGate>
  )
}

export default App
