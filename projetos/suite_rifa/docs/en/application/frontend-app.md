---
title: "Frontend Application"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-17"
updated: "2026-08-17"
version: "1.0"
---

# Frontend Application

> Language: EN | [Português (pt-BR)](../pt-BR/application/frontend-app.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Documents the React 19 frontend application architecture, routing, state management, UI components, and developer experience configuration.

## Stack

| Layer | Technology | Version |
| --- | --- | --- |
| UI Framework | React | 19.2.0 |
| SSR Framework | TanStack Start | 1.168.32 |
| Routing | TanStack Router | 1.170.18 |
| Server State | TanStack Query | 5.101.1 |
| Client State | Zustand | 5.0.14 |
| Forms | React Hook Form + Zod | 7.71.2 + 3.24.2 |
| CSS | Tailwind CSS 4 | 4.2.1 |
| UI Components | shadcn/ui + Radix UI | 46 components |
| Charts | Recharts | 2.15.4 |
| Notifications | Sonner | 2.0.7 |
| Date Handling | date-fns | 4.1.0 |

## File-Based Routing

TanStack Start uses file-based routing from `src/routes/`:

| Route File | URL Pattern | Description |
| --- | --- | --- |
| `__root.tsx` | Root layout | App shell, QueryClientProvider, ThemeProvider, Toaster |
| `index.tsx` | `/` | Redirects: auth → /dashboard, anon → /auth |
| `auth.tsx` | `/auth` | Login page with Google OAuth |
| `onboarding.tsx` | `/onboarding` | Create first organization |
| `dashboard.tsx` | `/dashboard` | Plan overview, usage metrics |
| `campaigns.tsx` | `/campaigns` | Campaign listing with metrics |
| `campaigns.create.tsx` | `/campaigns/create` | Create campaign form |
| `campaigns.$campaignId.tsx` | `/campaigns/:id` | Campaign detail (overview + images tabs) |
| `campaigns.$campaignId.edit.tsx` | `/campaigns/:id/edit` | Edit campaign form |
| `c.$slug.tsx` | `/c/:slug` | Public campaign page (anonymous) |
| `settings.organization.tsx` | `/settings/organization` | 5-tab org settings |
| `settings.users.tsx` | `/settings/users` | Members, invitations, roles |
| `settings.plan.tsx` | `/settings/plan` | Plan features and limits |
| `settings.usage.tsx` | `/settings/usage` | Usage vs limits progress |
| `settings.audit.tsx` | `/settings/audit` | Paginated audit trail |
| `platform.tsx` | `/platform` | GLOBAL_ADMIN cross-tenant panel |

## State Management

### Tenant Context (`useTenant.ts`)

Central hook providing:
- `organizationId`: Active organization UUID
- `role`: Current user's role (OWNER/ADMIN/MEMBER/VIEWER)
- `isGlobalAdmin`: Platform admin flag
- `isSuspended`: Organization suspension status
- `canWrite`: Write permission check (blocks on suspension)
- `switchOrganization(orgId)`: Switch active tenant

Tenant stored in Zustand (persisted to localStorage). Source of truth is always the server.

### Server State (`useCampaigns.ts`)

12 React Query hooks for campaign operations:
- Listing, metrics, detail, images
- Mutations: create, update, setStatus, uploadImage, deleteImage, setCover, reorder
- Public campaign query (no auth)

All hooks use tenant-scoped query keys for automatic cache invalidation on tenant switch.

### Permissions (`usePermissions.ts`)

- `can(permission)`: Check single permission
- `canWrite()`: Check write access (includes suspension check)
- `canAny(permissions[])`: Check any of multiple permissions

## Application Shell

### AppShell.tsx

Three-section sidebar:
1. **Principal**: Dashboard, Campanhas, Numeros (soon), Participantes (soon), Vendas (soon)
2. **Configurações**: Organização, Plano, Uso, Usuários, Auditoria
3. **Plataforma** (GLOBAL_ADMIN only): Administração

Header: OrganizationSwitcher, ThemeToggle, UserMenu

### PermissionGate.tsx

Component wrapping content based on permissions:
```tsx
<PermissionGate permission="campaigns.create">
  <CreateButton />
</PermissionGate>
```

Supports: single permission, array of permissions, `silent` mode.

## Build Configuration

### TypeScript

Strict mode with additional checks:
- `exactOptionalPropertyTypes`: Careful with `undefined`/`null` in types
- `noPropertyAccessFromIndexSignature`: Bracket notation for dynamic keys
- `noUncheckedIndexedAccess`: Index access may be undefined

### Vite

Uses `@lovable.dev/vite-tanstack-config` with:
- TanStack Start (SSR)
- React plugin
- Tailwind CSS
- TypeScript paths (`@/*` → `./src/*`)
- Nitro server (Cloudflare target)

### Linting

ESLint with: typescript-eslint, react-hooks, react-refresh, prettier

## File Structure

```
src/
├── components/
│   ├── app/           # AppShell, PermissionGate, ThemeToggle, UserMenu
│   ├── settings/      # Organization settings forms
│   └── ui/            # 46 shadcn/ui components
├── hooks/             # useTenant, usePermissions, useCampaigns, use-mobile
├── integrations/
│   ├── supabase/      # Client, server client, auth middleware, types
│   └── lovable/       # Auth wrapper
├── lib/               # rpc.ts, theme.tsx, utils.ts, error-capture.ts
├── routes/            # 17 route files (file-based routing)
├── server/            # Server entry, API routes
├── services/          # Campaign, membership, organization, permission, plan, tenant, types
├── stores/            # Tenant Zustand store
└── styles.css         # Tailwind 4 + custom theme tokens
```

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture Overview | [../architecture/overview.md](../architecture/overview.md) |
| Backend RPCs | [backend-rpcs.md](backend-rpcs.md) |
| Authentication | [authentication.md](authentication.md) |
| Permissions | [permissions.md](permissions.md) |
