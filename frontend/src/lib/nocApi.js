/**
 * NOC API Client - Sistema de Alertas y Monitoreo de Sites UISP
 * Base URL: http://190.7.234.37:7657/api/v1/alerting
 */

const NOC_BASE_URL = 'http://190.7.234.37:7657/api/v1/alerting'

// Helper para hacer requests
const nocFetch = async (endpoint, options = {}) => {
  const url = `${NOC_BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || `Error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// ==================== SITES ====================

export const sitesApi = {
  // Obtener todos los sites monitoreados
  getAll: () => nocFetch('/sites'),

  // Obtener sites con caídas (down o degraded)
  getOutages: () => nocFetch('/sites/outages'),

  // Obtener detalle de un site
  getById: (siteId) => nocFetch(`/sites/${siteId}`),

  // Escanear todos los sites (sin WhatsApp)
  scan: () => nocFetch('/scan-sites', { method: 'POST' }),

  // Escanear sites CON alertas de WhatsApp
  scanWithAlerts: () => nocFetch('/scan-sites-with-alerts', { method: 'POST' })
}

// ==================== EVENTOS ====================

export const eventsApi = {
  // Listar eventos con filtros
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.status) queryParams.append('status', params.status)
    if (params.severity) queryParams.append('severity', params.severity)
    if (params.event_type) queryParams.append('event_type', params.event_type)
    if (params.limit) queryParams.append('limit', params.limit)
    const query = queryParams.toString()
    return nocFetch(`/events${query ? `?${query}` : ''}`)
  },

  // Listar eventos activos
  getActive: () => nocFetch('/events/active'),

  // Obtener detalle de un evento
  getById: (eventId) => nocFetch(`/events/${eventId}`),

  // Crear evento manual
  create: (data) => nocFetch('/events', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Reconocer evento
  acknowledge: (eventId, data) => nocFetch(`/events/${eventId}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Resolver evento
  resolve: (eventId, data) => nocFetch(`/events/${eventId}/resolve`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Eliminar evento
  delete: (eventId) => nocFetch(`/events/${eventId}`, { method: 'DELETE' })
}

// ==================== POST-MORTEM ====================

export const postMortemApi = {
  // Listar post-mortems
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.status) queryParams.append('status', params.status)
    if (params.limit) queryParams.append('limit', params.limit)
    const query = queryParams.toString()
    return nocFetch(`/post-mortems${query ? `?${query}` : ''}`)
  },

  // Obtener detalle de un post-mortem
  getById: (pmId) => nocFetch(`/post-mortems/${pmId}`),

  // Crear post-mortem
  create: (data) => nocFetch('/post-mortems', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Actualizar post-mortem
  update: (pmId, data) => nocFetch(`/post-mortems/${pmId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Marcar como completado
  complete: (pmId) => nocFetch(`/post-mortems/${pmId}/complete`, { method: 'POST' }),

  // Marcar como revisado
  review: (pmId) => nocFetch(`/post-mortems/${pmId}/review`, { method: 'POST' }),

  // Generar reporte
  getReport: (pmId) => nocFetch(`/post-mortems/${pmId}/report`),

  // Eliminar post-mortem
  delete: (pmId) => nocFetch(`/post-mortems/${pmId}`, { method: 'DELETE' })
}

// ==================== POLLING ====================

export const pollingApi = {
  // Obtener estado del polling
  getStatus: () => nocFetch('/polling/status'),

  // Iniciar polling
  start: () => nocFetch('/polling/start', { method: 'POST' }),

  // Detener polling
  stop: () => nocFetch('/polling/stop', { method: 'POST' })
}

// ==================== WHATSAPP ====================

export const whatsappApi = {
  // Enviar notificación para un evento específico
  notifyEvent: (eventId, type = 'complete') => nocFetch(`/events/${eventId}/notify`, {
    method: 'POST',
    body: JSON.stringify({ type })
  }),

  // Test de notificación (legacy)
  testNotification: (data) => nocFetch('/test-notification', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// ==================== HEALTH ====================

export const healthApi = {
  // Health check
  check: () => nocFetch('/health')
}

// Export all APIs
export const nocApi = {
  sites: sitesApi,
  events: eventsApi,
  postMortem: postMortemApi,
  polling: pollingApi,
  whatsapp: whatsappApi,
  health: healthApi
}

export default nocApi
