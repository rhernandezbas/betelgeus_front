import { Navigate } from 'react-router-dom'
import { hasPermission, getCurrentUser } from '@/lib/permissions'

export function PermissionRoute({ children, requiredPermission }) {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true'
  const user = getCurrentUser()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check permission using the centralized function
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    if (user?.role === 'admin') {
      return <Navigate to="/" replace />
    } else if (user?.role === 'operator') {
      return <Navigate to="/operator-view" replace />
    }
    return <Navigate to="/login" replace />
  }

  return children
}

export function PermissionGuard({ permission, children, fallback = null }) {
  const user = getCurrentUser()

  // Check permission using the centralized function
  if (permission && !hasPermission(user, permission)) {
    return fallback || null
  }

  return children
}
