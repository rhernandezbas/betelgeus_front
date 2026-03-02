---
tdr: "1.0"
id: "api-integration"
title: "Integración con API Backend"
summary: "Reglas técnicas para el cliente API tipado, módulos, manejo de errores y comunicación con el backend Flask."
---

# rules

## Cliente API (src/lib/api.ts)
- Axios con baseURL configurable via VITE_API_URL (vacío en prod para proxy relativo)
- Instancia única de Axios: api = axios.create({...})
- Todos los endpoints agrupados en módulos exportados: adminApi, systemApi, messagesApi, logsApi, deviceAnalysisApi, whatsappApi
- Cada método retorna Promise<AxiosResponse<TipedResponse>>

## Tipado
- TODAS las interfaces en api.ts (no crear archivos de tipos separados)
- Interfaces para request y response de cada endpoint
- ApiResponse<T> genérico: { success: boolean, data?: T, error?: string, message?: string }
- Usar tipos unión para enums: 'manual' | 'auto_unassign' | 'splynx_sync'

## Patrón de llamada
- SIEMPRE usar try-catch en componentes que llaman API
- En catch: toast con variant 'destructive' y error.message
- En success: actualizar state local y opcionalmente toast de éxito
- Patrón obligatorio:
  ```javascript
  try {
    const response = await adminApi.getOperators()
    setOperators(response.data.operators)
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' })
  }
  ```

## Formato de respuesta del backend
- Éxito: { success: true, message: '...', data: ... }
- Error: { success: false, error: '...' }
- HTTP 200 para éxito, 400 para validación, 403 para permisos, 500 para error interno

## Proxy
- Desarrollo: Vite proxy /api -> http://localhost:5605 (vite.config.ts)
- Producción: Nginx proxy /api -> http://backend:7842 (nginx.conf)
- NUNCA hardcodear URLs de backend en código de componentes

## Autenticación en requests
- El backend usa sesiones con cookies (no JWT)
- Axios envía cookies automáticamente con withCredentials (configurado en instancia)
- Si respuesta 401: redirigir a /login

code_refs:
  - "frontend/src/lib/api.ts"
  - "vite.config.ts"
  - "nginx.conf"
