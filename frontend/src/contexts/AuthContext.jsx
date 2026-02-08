import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession, setSession as saveSession, clearSession, isSessionValid, getSessionTimeRemaining, renewSession } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'

const AuthContext = createContext(null)

const SESSION_WARNING_TIME = 5 * 60 * 1000 // Alertar 5 minutos antes de expirar
const AUTO_RENEW_THRESHOLD = 15 * 60 * 1000 // Auto-renovar si quedan menos de 15 minutos

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession())
  const [isAuthenticated, setIsAuthenticated] = useState(() => isSessionValid())
  const [sessionCheckInterval, setSessionCheckInterval] = useState(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  // Función para hacer login
  const login = useCallback((userData, expiresIn) => {
    saveSession(userData, expiresIn)
    setUser(userData)
    setIsAuthenticated(true)
  }, [])

  // Función para hacer logout
  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    setIsAuthenticated(false)
    navigate('/login', { replace: true })
  }, [navigate])

  // Auto-renovar sesión con interacciones del usuario
  useEffect(() => {
    if (!isAuthenticated) return

    const handleUserActivity = () => {
      const timeRemaining = getSessionTimeRemaining()

      // Si quedan menos de 15 minutos, renovar automáticamente
      if (timeRemaining > 0 && timeRemaining < AUTO_RENEW_THRESHOLD) {
        const renewed = renewSession()
        if (renewed) {
          console.log('🔄 Sesión renovada automáticamente (quedan menos de 15 min)')
        }
      }
    }

    // Escuchar eventos de actividad del usuario
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity)
      })
    }
  }, [isAuthenticated])

  // Verificar sesión periódicamente
  useEffect(() => {
    let warningShown = false

    const checkSession = () => {
      const timeRemaining = getSessionTimeRemaining()

      if (timeRemaining === 0 && isAuthenticated) {
        // Sesión expirada
        toast({
          title: 'Sesión Expirada',
          description: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          variant: 'destructive'
        })
        logout()
      } else if (timeRemaining > 0 && timeRemaining <= SESSION_WARNING_TIME && !warningShown) {
        // Advertencia de expiración próxima (solo si NO se está auto-renovando)
        // Si quedan menos de 15 minutos, la sesión se renovará automáticamente
        if (timeRemaining > AUTO_RENEW_THRESHOLD) {
          const minutesRemaining = Math.ceil(timeRemaining / 60000)
          toast({
            title: 'Sesión por Expirar',
            description: `Tu sesión expirará en ${minutesRemaining} minutos.`,
            variant: 'default',
            duration: 8000 // Mostrar por 8 segundos
          })
          warningShown = true
        }
      }

      // Resetear warning si se renovó la sesión
      if (timeRemaining > SESSION_WARNING_TIME) {
        warningShown = false
      }
    }

    // Verificar cada 60 segundos (reducido de 30 para ser menos intrusivo)
    if (isAuthenticated) {
      checkSession() // Verificar inmediatamente
      const interval = setInterval(checkSession, 60000)
      setSessionCheckInterval(interval)

      return () => {
        clearInterval(interval)
        setSessionCheckInterval(null)
      }
    }
  }, [isAuthenticated, logout, toast])

  // Verificar sesión al montar el componente
  useEffect(() => {
    const currentUser = getSession()
    if (currentUser) {
      setUser(currentUser)
      setIsAuthenticated(true)
    } else if (isAuthenticated) {
      // Si pensábamos que estábamos autenticados pero la sesión expiró
      logout()
    }
  }, []) // Solo al montar

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    setUser // Para actualizar datos del usuario sin hacer login de nuevo
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
