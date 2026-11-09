---
title: "Technology Stack"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Technology Stack

> 🇧🇷 Language: English

## Framework & Routing

| Package | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| TanStack Router | 1.170 | File-based routing with type safety |
| TanStack Start | 1.168 | Full-stack React meta-framework (SSR via Nitro) |
| TanStack Query | 5.x | Server state management (caching, mutations) |

## UI Layer

| Package | Version | Purpose |
|---|---|---|
| Tailwind CSS | 4.2 | Utility-first styling |
| Radix UI | — | 25+ headless primitives (Dialog, Select, DropdownMenu, etc.) |
| shadcn/ui | — | Pre-built component patterns on top of Radix + Tailwind |
| Lucide React | — | Icon library |
| Recharts | — | Dashboard charts and visualizations |
| Sonner | — | Toast notifications |
| Vaul | — | Drawer component |

## Forms & Validation

| Package | Version | Purpose |
|---|---|---|
| React Hook Form | 7.71 | Form state management and validation |
| Zod | 3.24 | Schema validation (shared with backend) |
| @hookform/resolvers | — | Zod ↔ React Hook Form integration |

## Backend & Database

| Package | Version | Purpose |
|---|---|---|
| @supabase/supabase-js | 2.112 | Supabase client (data, auth, storage, realtime) |
| @supabase/ssr | — | Server-side Supabase client for SSR |
| PostgreSQL | — | Primary database |
| pg_cron | — | Scheduled tasks (reservation expiry) |

## Authentication

| Provider | Method | Notes |
|---|---|---|
| Google OAuth | `@lovable.dev/cloud-auth-js` | Social login via Lovable Cloud Auth |
| Email/Password | Supabase Auth | Standard email + password registration |

## Payment Gateways

| Gateway | Integration | Status |
|---|---|---|
| InfinityPay | REST API + Webhooks | Active |
| Mercado Pago | REST API + Webhooks | Active |
| PagBank | REST API + Webhooks | Active |
| Manual | Internal recording | Active |
| QR Code | `qrcode` library | PIX code generation |

## Build Toolchain

| Package | Version | Purpose |
|---|---|---|
| Vite | 8.1 | Build tool and dev server |
| TypeScript | 5.8 | Type safety |
| ESLint | 9 | Linting |
| Prettier | — | Code formatting |
| Nitro | 3.0 | Server runtime (Cloudflare Workers target) |
| bun | — | Primary package manager |
| npm | — | Fallback package manager |

## Testing

| Package | Version | Purpose |
|---|---|---|
| Vitest | 4.1 | Unit and integration testing |
| @testing-library/react | 16.3 | Component testing utilities |
| jsdom | — | Browser environment simulation |

## Deployment

| Platform | Details |
|---|---|
| Lovable | Managed deployment platform |
| Cloudflare Workers | Edge runtime via Nitro |
| Vite | SSR bundle output |

## Utilities

| Package | Version | Purpose |
|---|---|---|
| date-fns | 4.1 | Date manipulation and formatting |
| xlsx (SheetJS) | 0.18.5 | Excel import/export (reports, CSV import) |
