---
tdr: "1.0"
id: "routing-and-auth"
title: "Routing y Autenticación"
summary: "Reglas técnicas para rutas protegidas, roles, permisos y layouts del frontend."
---

# rules

## Estructura de rutas
- React Router DOM v6 con rutas anidadas
- Rutas admin bajo / con Layout.jsx (sidebar colapsable)
- Rutas operador bajo /operator-view con OperatorLayout.jsx
- Ruta pública: /login (redirige si ya autenticado)

## Protección de rutas
- ProtectedRoute: verifica autenticación Y rol requerido
  ```jsx
  <ProtectedRoute requiredRole="admin">
    <Page />
  </ProtectedRoute>
  ```
- PermissionRoute: verifica permisos granulares del usuario
  ```jsx
  <PermissionRoute requiredPermission="can_access_noc_dashboard">
    <Page />
  </PermissionRoute>
  ```

## Roles y permisos
- Dos roles: admin (acceso completo) y operator (acceso limitado)
- Si role === 'admin': ignora permisos individuales, acceso total
- Permisos granulares en tabla users:
  - can_access_operator_view (default: true)
  - can_access_device_analysis (default: true)
  - can_access_noc_dashboard (default: false)
  - can_access_noc_control (default: false, admin-only)

## Sesiones
- Duración: 2 horas con auto-renovación
- Almacenamiento: sessionStorage (no persiste entre tabs)
- Auto-renovación si quedan <15 min Y usuario está activo
- Warning toast a 5 min de expirar
- Logout automático al expirar

## Layouts
- Layout.jsx: Sidebar responsive (drawer en mobile, fixed en desktop), colapsable a iconos
- OperatorLayout.jsx: Similar pero con navegación dinámica según permisos
- Navegación definida como array de { name, href, icon }
- SIEMPRE agregar nuevas páginas al array de navegación del Layout correspondiente

## Agregar nueva página (checklist)
1. Crear componente en src/pages/NuevaPage.jsx
2. Agregar Route en App.jsx dentro del layout correcto
3. Agregar item de navegación en Layout.jsx (y/o OperatorLayout.jsx)
4. Si requiere permiso especial: usar PermissionRoute

code_refs:
  - "frontend/src/App.jsx"
  - "frontend/src/components/Layout.jsx"
  - "frontend/src/components/OperatorLayout.jsx"
  - "frontend/src/components/ProtectedRoute.jsx"
  - "frontend/src/components/PermissionRoute.jsx"
  - "frontend/src/contexts/AuthContext.jsx"
  - "frontend/src/lib/auth.js"
  - "frontend/src/lib/permissions.js"
