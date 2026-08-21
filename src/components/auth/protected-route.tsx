import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth-store'

export function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)
  const status = useAuthStore((state) => state.status)

  if (status !== 'ready') {
    return null
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
