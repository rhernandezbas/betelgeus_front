# ADR-003: Component Library

## Status
Accepted

## Date
2026-03-02

## Context
The application needs consistent, accessible UI components that follow a unified design system. Components must be customizable, composable, and maintainable.

## Decision

### Component Stack
- **shadcn/ui**: Copy-paste component library built on Radix UI primitives
- **Radix UI**: Unstyled, accessible component primitives (Dialog, Select, Tabs, etc.)
- **TailwindCSS**: Utility-first CSS framework with CSS variables for theming
- **Lucide React**: Icon library for consistent iconography

### Styling Approach
- CSS variables defined in `index.css` `:root` using HSL color format
- Design tokens: `--primary`, `--secondary`, `--background`, `--foreground`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, etc.
- `cn()` utility function combining `clsx` and `tailwind-merge` for conditional class composition

### Component Organization
- shadcn/ui components live in `frontend/src/components/ui/`
- Application-specific components live in `frontend/src/components/`
- Each component is self-contained with its own styles via Tailwind classes

## Consequences

### Positive
- Full control over component source code (shadcn/ui is copy-paste, not a dependency)
- Accessible by default via Radix UI primitives
- Consistent theming through CSS variables
- Easy to customize without fighting a component library

### Negative
- Manual updates required when shadcn/ui releases improvements
- CSS variable theming requires HSL format awareness
