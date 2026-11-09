---
title: "Security"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Security

> 🇧🇷 Language: English

## Authentication

Supabase Auth provides identity management for all users.

| Method | Implementation | Notes |
|---|---|---|
| Google OAuth | `@lovable.dev/cloud-auth-js` | Social login, one-tap registration |
| Email/Password | Supabase Auth | Standard registration with email verification |

**Session Management**:
- Sessions are persisted in `localStorage` with automatic token refresh
- Server-side session validation via `requireSupabaseAuth()` middleware in server functions
- Route-level session guard in `_authenticated/route.tsx`

**Bootstrap**: The first user to register is automatically assigned the `GLOBAL_ADMIN` role.

## Authorization

### Roles

| Role | Description | Permissions |
|---|---|---|
| `GLOBAL_ADMIN` | Full platform control | 55 permissions (all) |
| `ADMIN` | Operational admin | Broad access via `user_has_admin_role()` |
| `PUBLISHER` | Campaign creator/operator | Scoped to own campaigns |

### Permission System

- **55 granular permissions** defined in `src/lib/permissions.ts`
- Permissions cover: campaigns, orders, customers, payments, notifications, files, dashboard, admin (users, roles, settings, gateways, audit, reports)
- Role assignments stored in `profiles.role_id` → `roles.id`

### Enforcement Layers

| Layer | Mechanism | File |
|---|---|---|
| Server Functions | `requirePermission("resource.action")` | `*.server.ts` modules |
| Global Admin Check | `requireGlobalAdmin()` | Admin-only server functions |
| Route Guards | Session check in `_authenticated/route.tsx` | Client-side redirect |
| Role Guard | Role check in `_authenticated/admin/route.tsx` | Admin route protection |
| Row Level Security | Database policies per role | PostgreSQL RLS |

## Row Level Security (RLS)

RLS is enabled on **all tables** in the database.

### Policy Strategy

| Role | Access Pattern | Enforcement |
|---|---|---|
| **GLOBAL_ADMIN** | Full bypass | Service-role client (`supabaseAdmin`) — no RLS applied |
| **ADMIN** | Broad read/write | `user_has_admin_role()` SQL helper |
| **PUBLISHER** | Own campaigns only | `campaigns.created_by = auth.uid()` |
| **Anonymous** | Public data only | Limited to public campaign views and checkout |

### Client Separation

| Client | RLS Scope | Where Used |
|---|---|---|
| `supabase` (anon/auth) | Scoped by RLS policies | Client-side data fetching |
| `supabaseAdmin` (service-role) | Bypasses all RLS | Server-only `*.server.ts` modules |

## Payment Security

### Gateway Credentials

- Stored in `payment_gateway_settings` table as JSONB
- Table has **no anon or authenticated grants** — only service-role access
- Service-role client is never exposed to the browser

### Webhook Validation

- All webhook endpoints validate gateway-specific signatures before processing
- Invalid signatures are rejected with appropriate error responses

### Idempotency

- `payment_events` table enforces idempotency via `UNIQUE(gateway, event_id)`
- Duplicate webhook payloads are silently ignored

### Environment Isolation

Each gateway supports `SANDBOX` and `PRODUCTION` environments, configurable per gateway in the admin console.

## LGPD Compliance

### Data Masking

Helper functions mask sensitive personal data:
- Phone numbers
- Email addresses
- CPF (Brazilian tax ID)

### Soft-Delete

Soft-delete pattern (`deleted_at` column) implemented on:
- `campaigns` — campaigns moved to trash, not permanently deleted
- `customers` — customer records retained but hidden

### Secret Hardening

Migration files include secret hardening patterns — credentials and sensitive values are never committed in plaintext.

### Audit Trail

`audit_logs` table records all state-changing operations with:
- `actor_id` — who performed the action
- `IP` address
- `user_agent` string
- `old_value` and `new_value` (JSONB snapshots)

## Database Security

### Advisory Locks

Concurrent number reservation uses PostgreSQL advisory locks to prevent double-sell:
1. `reserve_campaign_numbers` RPC acquires a session-level advisory lock
2. Validates number availability within the locked transaction
3. Updates status atomically
4. Releases lock

### Automatic Expiry

`pg_cron` runs `release_expired_campaign_reservations` on a schedule to free numbers whose `reserved_until` has passed.

### Rate Limiting

`get_reservation_count_by_device()` RPC enforces per-device reservation limits within a configurable time window, preventing reservation abuse.
