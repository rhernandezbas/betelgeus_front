import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    // Si es operador intentando acceder a rutas de admin, redirigir a su vista
    if (user.role === 'operator') {
      return <Navigate to="/operator-view" replace />
    }
    // Si es admin intentando acceder a vista de operador, permitir
    return <Navigate to="/" replace />
  }

  return children
}

export function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated && user) {
    // Redirigir según el rol
    if (user.role === 'admin') {
      return <Navigate to="/" replace />
    } else if (user.role === 'operator') {
      return <Navigate to="/operator-view" replace />
    }
  }

  return children
}
