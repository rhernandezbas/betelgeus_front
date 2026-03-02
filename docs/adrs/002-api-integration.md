# ADR-002: API Integration Pattern

## Status
Accepted

## Date
2026-03-02

## Context
The frontend communicates with the Flask backend via REST API. We need a consistent, typed pattern for making API calls, handling errors, and managing the development/production proxy configuration.

## Decision

### Typed Axios Client
- Centralized Axios instance with base configuration
- Module pattern for API organization: `adminApi`, `systemApi`, `ticketApi`, `authApi`, etc.
- Each module exports typed functions for its domain endpoints

### Proxy Configuration

#### Development
- Vite dev server proxies `/api` requests to `localhost:5605` (Flask backend)
- Configured in `vite.config.ts`

#### Production
- Nginx reverse proxy forwards `/api` requests to `backend:7842` (Docker service)
- Configured in `nginx.conf`

### Response Format
All backend API responses follow a standard format:
```json
{
  "success": true|false,
  "data": {},
  "error": "error message if any",
  "message": "human-readable message"
}
```

### Error Handling
- All API calls wrapped in `try-catch` blocks
- Errors displayed to users via toast notifications
- Network errors and HTTP errors handled uniformly
- 401 responses trigger session cleanup and redirect to login

## Consequences

### Positive
- Consistent API interaction pattern across the entire frontend
- Type safety reduces runtime errors
- Centralized error handling simplifies debugging
- Proxy configuration keeps frontend/backend decoupled

### Negative
- Module pattern requires maintenance as API grows
- No automatic cache invalidation or request deduplication
