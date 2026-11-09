---
title: "Deployment"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Deployment

> 🇧🇷 Language: English

## Platform

| Item | Details |
|---|---|
| **Hosting** | Lovable (https://lovable.dev) |
| **Live URL** | https://olivelas-raffle.lovable.app |
| **Runtime** | Cloudflare Workers (via Nitro) |
| **Build** | Vite 8 → Nitro → Cloudflare Workers (SSR) |
| **Branch** | main (auto-deploy on push) |
| **Package Manager** | bun (primary), npm (fallback) |

## Supabase Project

| Item | Details |
|---|---|
| **Project ID** | ltunklugdhgidqokhzcu |
| **Services** | PostgreSQL, PostgREST, Auth, Storage, Realtime, pg_cron |

## Environment Variables

| Variable | Scope | Description |
|---|---|---|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Client + Server | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | Client + Server | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service-role key (never exposed to client) |
| `VITE_SITE_URL` / `SITE_URL` | Client + Server | Public site URL (for sharing links, SEO) |

> ⚠️ **Security**: `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser. It is only used in `*.server.ts` modules via the `supabaseAdmin` client.

## Build Commands

| Command | Description |
|---|---|
| `bun run dev` | Start local development server |
| `bun run build` | Production build (Vite → Nitro → Cloudflare Workers) |
| `bun run preview` | Preview production build locally |
| `bun run lint` | Run ESLint |
| `bun run test` | Run Vitest test suite |

## Database Migrations

Migrations are SQL files in the Supabase migrations directory.

**Naming Convention**: `YYYYMMDDHHMMSS_description.sql`

Example: `20260812230000_add_advanced_fee_payment.sql`

**Execution Methods**:
- **Supabase SQL Editor**: Manual execution via the Supabase dashboard
- **`supabase db push`**: CLI-based migration push

**Idempotency**: All migrations use `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, and similar patterns to be safely re-runnable.

## CI/CD Pipeline

Lovable manages the deployment pipeline:

1. **Push to main** triggers automatic build and deployment
2. **Vite build** generates the route tree automatically
3. **Nitro** bundles the SSR application for Cloudflare Workers
4. **Cloudflare Workers** serves the application at the edge

No manual deployment steps are required — pushing to the `main` branch is the only trigger needed.

## Local Development

### Prerequisites

- [bun](https://bun.sh) (recommended) or npm
- Access to the Supabase project (URL + anon key from environment)

### Setup

```bash
# Clone the repository
git clone https://github.com/pycriador-org/olivelas-raffle.git
cd olivelas-raffle

# Install dependencies
bun install

# Start development server
bun run dev
```

The development server starts with SSR enabled, proxying to the Supabase backend.

### Testing

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test --watch
```

### Linting

```bash
# Check for lint errors
bun run lint
```
