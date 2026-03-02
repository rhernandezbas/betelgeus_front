---
tdr: "1.0"
id: "react-conventions"
title: "Convenciones React del Proyecto"
summary: "Reglas de implementación para componentes, hooks, estado y patrones generales del frontend React."
---

# rules

## Estructura de componentes
- Páginas en src/pages/ son self-contained con su propio state (useState, useEffect)
- Componentes reutilizables en src/components/ con props tipadas
- Componentes UI (shadcn/ui) en src/components/ui/ - NO modificar directamente
- Componentes de dominio agrupados por feature (operators/, noc/, device-analysis/)

## Patrones de estado
- SIEMPRE usar React hooks (useState, useEffect, useCallback, useMemo) para estado local
- AuthContext (src/contexts/AuthContext.jsx) para estado de sesión global
- Custom hooks en src/hooks/ para lógica compartida compleja
- NUNCA usar Redux, Zustand u otra librería de estado global
- sessionStorage para persistencia de sesión (no localStorage)

## Patrón de carga de datos
- useEffect en mount para carga inicial
- Auto-refresh con setInterval donde aplique (ej: Dashboard cada 30s)
- Cleanup de intervals en return del useEffect
- Loading state con useState para indicadores de carga
- Error handling con try-catch + toast notification

## Convenciones de nombrado
- Componentes: PascalCase (ej: OperatorCard.jsx)
- Funciones y hooks: camelCase (ej: useNOCData, fetchOperators)
- Constantes: UPPER_SNAKE_CASE (ej: API_BASE_URL)
- Archivos de componentes: PascalCase (ej: Dashboard.jsx)
- Archivos de utilidades: camelCase (ej: api.ts, utils.js)

## Notificaciones toast
- SIEMPRE usar useToast() hook de src/hooks/use-toast.js
- Éxito: toast({ title: 'Éxito', description: '...' })
- Error: toast({ title: 'Error', description: error.message, variant: 'destructive' })
- NUNCA usar alert() o console.log() para feedback al usuario

## Estilos
- SIEMPRE usar TailwindCSS classes, NUNCA CSS inline
- Usar cn() de src/lib/utils.js para merge condicional de classes
- CSS variables de index.css para colores del tema (HSL format)
- Spacing consistente: gap-4 horizontal, space-y-6 vertical
- Responsive: mobile-first, breakpoint lg (1024px) para desktop

## Idioma de la UI
- TODOS los labels, títulos, mensajes y placeholders en español
- Nombres de variables y funciones en inglés
- Comentarios opcionales en español o inglés

code_refs:
  - "frontend/src/pages/"
  - "frontend/src/components/"
  - "frontend/src/hooks/"
  - "frontend/src/contexts/AuthContext.jsx"
  - "frontend/src/lib/utils.js"
