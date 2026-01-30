import { Navigate } from 'react-router-dom'

export function PermissionRoute({ children, requiredPermission }) {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true'
  const user = JSON.parse(sessionStorage.getItem('user') || '{}')

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Si el usuario no tiene el permiso requerido, redirigir según su rol
  if (requiredPermission && user[requiredPermission] === false) {
    if (user.role === 'admin') {
      return <Navigate to="/" replace />
    } else if (user.role === 'operator') {
      return <Navigate to="/operator-view" replace />
    }
    return <Navigate to="/login" replace />
  }

  return children
}

export function PermissionGuard({ permission, children, fallback = null }) {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}')
  
  // Si el usuario no tiene el permiso, mostrar el fallback o nada
  if (permission && user[permission] === false) {
    return fallback || null
  }
  
  return children
}
