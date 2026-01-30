# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Betelgeuse** is a Splynx Admin Panel - a React-based web application for managing ticket assignment operators, schedules, and system configuration. The frontend communicates with a backend API (not in this repo) for operator management, ticket auditing, device analysis, and system metrics.

**Key Characteristics:**
- Frontend-only repository (backend is separate)
- Admin and operator role-based access
- Real-time system monitoring and control
- Multi-page SPA with protected routes

## Development Commands

### Setup
```bash
cd frontend
npm install
```

### Development
```bash
# Start dev server (port 3000, proxies /api to localhost:5605)
npm run dev

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment
The project uses GitHub Actions for automatic deployment to VPS (190.7.234.37:7842). On push to `main`, it:
1. SSHs to VPS
2. Pulls latest code to `/opt/splynx-tickets`
3. Builds Docker image
4. Deploys via Docker Compose

Manual deployment trigger: GitHub Actions → "Deploy to VPS" → "Run workflow"

## Architecture

### Frontend Stack
- **React 18** with React Router for navigation
- **Vite** as build tool
- **TailwindCSS** for styling with custom design tokens
- **shadcn/ui + Radix UI** for component library
- **Axios** for HTTP requests
- **Recharts** for data visualization
- **Lucide React** for icons

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (Button, Card, Dialog, etc.)
│   │   ├── Layout.jsx       # Admin layout with collapsible sidebar
│   │   ├── OperatorLayout.jsx  # Operator-specific layout
│   │   ├── ProtectedRoute.jsx  # Role-based route protection
│   │   └── PermissionRoute.jsx # Permission-based route protection
│   ├── pages/               # Page components (Dashboard, Operators, etc.)
│   ├── lib/
│   │   ├── api.js          # API client with all endpoints
│   │   └── utils.js        # cn() utility for className merging
│   ├── hooks/
│   │   └── use-toast.js    # Toast notification hook
│   ├── App.jsx             # Route definitions
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles + CSS variables
├── public/                 # Static assets
├── Dockerfile              # Multi-stage build with Nginx
├── nginx.conf             # Nginx config with /api proxy
├── vite.config.js         # Vite config with @ alias
└── tailwind.config.js     # Tailwind theme customization
```

### Authentication & Authorization

**Authentication:**
- Session-based using `sessionStorage`
- Login at `/login` sets `isAuthenticated` and `user` object
- `ProtectedRoute` wrapper guards routes requiring authentication

**Authorization:**
- Two roles: `admin` and `operator`
- `ProtectedRoute` enforces role requirements
- `PermissionRoute` enforces fine-grained permissions (e.g., `can_access_device_analysis`)
- Admins access routes under `/`
- Operators access routes under `/operator-view`

### Routing Architecture

**Admin Routes** (require `role: admin`):
- `/` - Dashboard with system stats and controls
- `/operators-management` - Manage operators, schedules, pauses
- `/configuration` - System configuration parameters
- `/messages` - Message templates management
- `/metrics` - Operator performance metrics
- `/users` - User management
- `/audit` - Audit logs
- `/audit-tickets` - Ticket audit requests
- `/reassignment-history` - Ticket reassignment history
- `/logs` - System logs viewer
- `/device-analysis` - Device analysis tool (permission-gated)

**Operator Routes** (require `role: operator`):
- `/operator-view` - Operator dashboard (permission-gated)
- `/operator-view/device-analysis` - Device analysis (permission-gated)

### API Client (`src/lib/api.js`)

**Base Configuration:**
- Uses `VITE_API_URL` env var (defaults to empty for relative URLs)
- In development: Vite proxies `/api` to `http://localhost:5605`
- In production: Nginx proxies `/api` to backend service

**API Modules:**
- `adminApi` - Operator, schedule, config, metrics, audit operations
- `systemApi` - System status, pause/resume
- `messagesApi` - Message templates CRUD
- `logsApi` - System logs and stats
- `deviceAnalysisApi` - Device analysis operations

**Usage Pattern:**
```javascript
import { adminApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

try {
  const response = await adminApi.getOperators()
  // Handle response.data
} catch (error) {
  toast({
    title: 'Error',
    description: error.message,
    variant: 'destructive'
  })
}
```

### Component Patterns

**shadcn/ui Components:**
All UI components in `src/components/ui/` follow shadcn/ui conventions:
- Use `cn()` utility for conditional classes
- Styled with Tailwind + CSS variables from `index.css`
- Radix UI primitives for accessibility

**Layout Components:**
- `Layout.jsx` - Responsive sidebar (collapsible on desktop, drawer on mobile)
- Navigation items defined in array with `name`, `href`, `icon`
- Logout functionality via `/api/auth/logout`

**Page Components:**
- Self-contained with own state management
- Use `useEffect` for data fetching on mount
- Often include auto-refresh intervals (e.g., Dashboard every 30s)
- Error handling via toast notifications

### Styling System

**TailwindCSS:**
- Custom theme in `tailwind.config.js`
- Dark mode support via `class` strategy
- CSS variables for colors (HSL format)

**CSS Variables (`:root` in `index.css`):**
- `--primary`, `--secondary`, `--destructive`, `--muted`, etc.
- `--radius` for border-radius consistency

**Utility Function:**
```javascript
import { cn } from '@/lib/utils'

// Merges Tailwind classes, resolving conflicts
<div className={cn("base-class", condition && "conditional-class")} />
```

### Docker Deployment

**Multi-stage Dockerfile:**
1. **Builder stage:** Node 18 Alpine, installs deps, runs `npm run build`
2. **Production stage:** Nginx Alpine, copies built files to `/usr/share/nginx/html`

**Nginx Configuration:**
- Serves static files from `/usr/share/nginx/html`
- Proxies `/api/*` to `http://backend:7842`
- React Router support: all routes fallback to `index.html`
- Gzip compression enabled
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)

**Environment Variables:**
- `VITE_API_URL` - API base URL (default: empty string for relative URLs)
- Set in `.env` for local dev, `""` for production (uses Nginx proxy)

## Key Features

### Real-time Dashboard
- System status indicator (active/paused)
- Operator statistics (total, active, paused, on break)
- Ticket assignment counters
- Auto-refresh every 30 seconds

### Operator Management
- View all operators with status
- Pause/resume operators with reason tracking
- Configure notification settings per operator
- View assigned tickets and schedules

### Schedule Management
- Create/edit operator schedules by day of week
- Time range validation
- Dual-view and editable interfaces

### Audit System
- Full audit log of configuration changes
- Ticket reassignment history tracking
- Audit ticket requests with approval workflow

### Device Analysis
- Splynx device analysis integration
- Analysis history and metrics
- Feedback system
- API logs viewer

## Common Workflows

### Adding a New Page

1. Create page component in `src/pages/`:
```jsx
// src/pages/NewPage.jsx
export default function NewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Page</h1>
      {/* Content */}
    </div>
  )
}
```

2. Add route in `App.jsx`:
```jsx
import NewPage from './pages/NewPage'

<Route path="new-page" element={<NewPage />} />
```

3. Add navigation item in `Layout.jsx`:
```jsx
import { Icon } from 'lucide-react'

const navigation = [
  // ...
  { name: 'New Page', href: '/new-page', icon: Icon }
]
```

### Adding a New API Endpoint

In `src/lib/api.js`:
```javascript
export const adminApi = {
  // ...
  newEndpoint: (params) => api.get('/api/admin/new-endpoint', { params }),
  createItem: (data) => api.post('/api/admin/items', data),
}
```

### Creating a Protected Route

```jsx
<Route path="sensitive-page" element={
  <PermissionRoute requiredPermission="can_access_feature">
    <SensitivePage />
  </PermissionRoute>
} />
```

## Important Notes

- **Backend Dependency:** This frontend requires a backend API running on port 5605 (dev) or accessible via Docker service name `backend` (prod)
- **State Management:** Uses React hooks and local state (no Redux/Zustand)
- **Authentication:** Session-based, stored in `sessionStorage` (not persistent across tabs)
- **Path Alias:** `@` maps to `src/` directory (configured in `vite.config.js`)
- **Proxy Setup:** Development proxy in Vite, production proxy in Nginx
- **Port Configuration:** Dev server runs on 3000, production Nginx on 80 (mapped to 7842 on host)

## Deployment Configuration

- **VPS:** 190.7.234.37:7842
- **Deploy Path:** `/opt/splynx-tickets`
- **GitHub Actions:** `.github/workflows/deploy.yml`
- **Docker Compose:** Backend service runs on internal port 7842
- **Deployment Docs:** See `.github/DEPLOYMENT.md` for detailed setup instructions