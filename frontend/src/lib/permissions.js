/**
 * Permission Groups System
 *
 * Define permission groups and their associated permissions.
 * Groups make it easier to manage related permissions together.
 */

// Individual permissions with their metadata
export const PERMISSIONS = {
  // Operator permissions (legacy - default true for backwards compatibility)
  can_access_operator_view: {
    label: 'Vista Operador',
    description: 'Acceso a la vista de operador',
    group: 'operator',
    defaultValue: true // Legacy permission
  },

  // Device Analysis permissions (legacy - default true for backwards compatibility)
  can_access_device_analysis: {
    label: 'Análisis Dispositivos',
    description: 'Acceso al análisis de dispositivos',
    group: 'tools',
    defaultValue: true // Legacy permission
  },

  // NOC permissions (new - default false, must be explicitly granted)
  can_access_noc_dashboard: {
    label: 'NOC Dashboard',
    description: 'Acceso al dashboard NOC (vista de sites, eventos, métricas)',
    group: 'noc',
    defaultValue: false // Must be explicitly granted
  },
  can_access_noc_control: {
    label: 'NOC Control',
    description: 'Control del sistema NOC (polling, WhatsApp, post-mortems)',
    group: 'noc',
    defaultValue: false, // Must be explicitly granted
    requiresAdmin: true // Solo admin puede otorgar este permiso
  }
}

// Permission groups for UI organization
export const PERMISSION_GROUPS = {
  noc: {
    label: 'NOC - Centro de Operaciones',
    description: 'Monitoreo de sites UISP, alertas y eventos',
    icon: 'AlertTriangle',
    color: 'red',
    permissions: ['can_access_noc_dashboard', 'can_access_noc_control']
  },
  tools: {
    label: 'Herramientas',
    description: 'Herramientas de análisis y diagnóstico',
    icon: 'Wrench',
    color: 'blue',
    permissions: ['can_access_device_analysis']
  },
  operator: {
    label: 'Operador',
    description: 'Funcionalidades para operadores',
    icon: 'User',
    color: 'green',
    permissions: ['can_access_operator_view']
  }
}

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object from session
 * @param {string} permission - Permission key to check
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user) {
    console.log('[Permissions] No user provided')
    return false
  }

  // Admin role has all permissions
  if (user.role === 'admin') {
    console.log('[Permissions] User is admin, granting all permissions')
    return true
  }

  // Get permission config
  const permConfig = PERMISSIONS[permission]
  const defaultValue = permConfig?.defaultValue ?? true // Legacy behavior: default true

  // If permission is explicitly set, use that value
  if (user[permission] !== undefined) {
    const hasIt = user[permission] === true
    console.log(`[Permissions] ${permission}: ${hasIt} (explicit value: ${user[permission]})`)
    return hasIt
  }

  // Otherwise use default value
  console.log(`[Permissions] ${permission}: ${defaultValue} (using default)`)
  return defaultValue
}

/**
 * Check if a user has any permission from a group
 * @param {Object} user - User object from session
 * @param {string} groupKey - Permission group key
 * @returns {boolean}
 */
export function hasGroupPermission(user, groupKey) {
  if (!user) return false

  // Admin role has all permissions
  if (user.role === 'admin') return true

  const group = PERMISSION_GROUPS[groupKey]
  if (!group) return false

  // Check if user has at least one permission from the group
  return group.permissions.some(perm => hasPermission(user, perm))
}

/**
 * Check if user can manage a permission (for admin UI)
 * @param {Object} currentUser - Current logged in user
 * @param {string} permission - Permission to manage
 * @returns {boolean}
 */
export function canManagePermission(currentUser, permission) {
  if (!currentUser) return false

  // Only admin can manage permissions
  if (currentUser.role !== 'admin') return false

  // Some permissions require admin to grant
  const permConfig = PERMISSIONS[permission]
  if (permConfig?.requiresAdmin) {
    return currentUser.role === 'admin'
  }

  return true
}

/**
 * Get user's current session
 * @returns {Object|null}
 */
export function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

/**
 * Check if current user is admin
 * @returns {boolean}
 */
export function isAdmin() {
  const user = getCurrentUser()
  return user?.role === 'admin'
}
