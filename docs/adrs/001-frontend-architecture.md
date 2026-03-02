# ADR-001: Frontend Architecture

## Status
Accepted

## Date
2026-03-02

## Context
Betelgeuse frontend is a React SPA that serves as the admin panel for the Splynx ticket management system. It needs to support two user roles (admin and operator), provide real-time dashboards, manage operators and schedules, and communicate with a Flask backend API.

## Decision

### Technology Stack
- **React 18** with functional components and hooks
- **Vite** as build tool and dev server
- **TailwindCSS** for utility-first styling
- **shadcn/ui** + **Radix UI** for accessible, composable UI components
- **Axios** for HTTP client (typed, module-based)
- **Recharts** for data visualization and charts

### Architecture Pattern
- **Pages pattern**: Each page is self-contained with its own hooks, state management, and API calls
- **shadcn/ui components**: Reusable UI primitives in `frontend/src/components/ui/`
- **Typed API client**: Centralized Axios instance with per-module API functions

### Authentication
- **Session-based** authentication with `sessionStorage`
- 2-hour session expiry with automatic renewal
- Role-Based Access Control (RBAC): `admin` (full access) and `operator` (limited access)
- `AuthContext` provides session state to all components

### State Management
- **React hooks only** (no Redux, Zustand, or other state libraries)
- `AuthContext` for session/authentication state
- Custom hooks for complex component-level state
- No global state management beyond auth context

## Consequences

### Positive
- Simple architecture, easy to onboard new developers
- Fast build times with Vite
- Consistent UI with shadcn/ui and TailwindCSS
- Type-safe API interactions

### Negative
- No global state management may become limiting as the app grows
- Page-level state isolation means some data fetching may be duplicated across pages
