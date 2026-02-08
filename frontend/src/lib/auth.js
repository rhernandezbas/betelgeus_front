// Gestión de sesiones con expiración automática

const SESSION_DURATION = 3600000 // 1 hora en milisegundos
const SESSION_KEY = 'betelgeuse_session'

/**
 * Guarda la sesión del usuario con tiempo de expiración
 * @param {Object} user - Datos del usuario
 * @param {number} expiresIn - Duración de la sesión en ms (default: 1 hora)
 */
export function setSession(user, expiresIn = SESSION_DURATION) {
  const session = {
    user,
    expiresAt: Date.now() + expiresIn,
    createdAt: Date.now()
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  sessionStorage.setItem('isAuthenticated', 'true')
  sessionStorage.setItem('user', JSON.stringify(user)) // Mantener para compatibilidad
}

/**
 * Obtiene la sesión actual, validando si expiró
 * @returns {Object|null} - Usuario o null si expiró/no existe
 */
export function getSession() {
  try {
    const sessionData = sessionStorage.getItem(SESSION_KEY)
    if (!sessionData) return null

    const session = JSON.parse(sessionData)

    // Verificar si la sesión expiró
    if (Date.now() > session.expiresAt) {
      clearSession()
      return null
    }

    return session.user
  } catch (error) {
    console.error('Error al obtener sesión:', error)
    clearSession()
    return null
  }
}

/**
 * Verifica si hay una sesión activa válida
 * @returns {boolean}
 */
export function isSessionValid() {
  return getSession() !== null
}

/**
 * Limpia la sesión completamente
 */
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem('isAuthenticated')
  sessionStorage.removeItem('user')
}

/**
 * Renueva la sesión actual extendiendo el tiempo de expiración
 */
export function renewSession() {
  const user = getSession()
  if (user) {
    setSession(user)
    return true
  }
  return false
}

/**
 * Obtiene el tiempo restante de la sesión en milisegundos
 * @returns {number} - Tiempo restante o 0 si no hay sesión
 */
export function getSessionTimeRemaining() {
  try {
    const sessionData = sessionStorage.getItem(SESSION_KEY)
    if (!sessionData) return 0

    const session = JSON.parse(sessionData)
    const remaining = session.expiresAt - Date.now()

    return remaining > 0 ? remaining : 0
  } catch (error) {
    return 0
  }
}
