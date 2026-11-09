---
title: "RaffleHub SaaS"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-17"
updated: "2026-08-17"
version: "1.0"
---

# RaffleHub SaaS

> Language: EN | [Português (pt-BR)](../pt-BR/project-overview.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

RaffleHub is a multi-tenant SaaS platform for managing digital raffles (rifas). It enables organizations to create, publish, and manage raffle campaigns where participants purchase numbered tickets. The platform handles the complete lifecycle: campaign creation, number generation, reservation, sales, participant management, and draw execution.

## Problem

Manual raffle management is error-prone, lacks transparency, and scales poorly. RaffleHub solves this by providing a centralized, auditable, multi-tenant platform where each organization manages its own campaigns, participants, and financial data with full traceability.

## Scope

| In scope | Notes |
| --- | --- |
| Multi-tenant organization management | RBAC, plans, limits, billing foundation |
| Campaign lifecycle | DRAFT → PUBLISHED → PAUSED → FINISHED → ARCHIVED |
| Number generation and reservation | Lazy grid, TTL-based reservations, concurrency control |
| Participant management | Per-campaign deduplication by phone |
| Manual sales with number assignment | Quick sale, full sale, edit, transfer, cancel |
| Image management | Cover/gallery with proxy, signed URLs |
| Public campaign pages | Anonymous access via slug, number grid display |
| Audit logging | All mutations recorded with actor/context |
| Platform administration | GLOBAL_ADMIN cross-tenant management |

| Non-goal | Rationale |
| --- | --- |
| Online payment processing | Deferred to Sprint 6+ (PIX, gateways) |
| Draw execution / lottery engine | Deferred to Sprint 7+ |
| Mobile native apps | Web-first; responsive design via Tailwind |
| API for third-party integrations | Future consideration |
| Real-time chat / messaging | Out of scope |
| White-label marketplace | Future consideration |

## Users / Consumers

| User / consumer | Need |
| --- | --- |
| Organization Owner | Full control: settings, billing, members, campaigns, numbers, sales |
| Organization Admin | Campaign management, member management, number/sale operations |
| Organization Member | Campaign operations, number management, sales, participant lookup |
| Organization Viewer | Read-only access to campaigns, numbers, participants, sales |
| Anonymous visitor | Browse public campaigns, view available numbers |
| Platform Admin (GLOBAL_ADMIN) | Cross-tenant oversight, organization management, platform metrics |

## Architecture

- Overview: TanStack Start (SSR) + React 19 frontend, Supabase (PostgreSQL + Auth + Storage + Edge Functions) backend, Lovable Cloud hosting. All business logic lives in PostgreSQL RPC functions (SECURITY DEFINER). Frontend never writes to tables directly.
- Details: [architecture/overview.md](architecture/overview.md)

## Components

| Component | Responsibility | Documentation |
| --- | --- | --- |
| Frontend (React 19) | UI rendering, form handling, state management | [application/frontend-app.md](application/frontend-app.md) |
| Supabase RPCs | Business logic, validation, authorization, audit | [application/backend-rpcs.md](application/backend-rpcs.md) |
| PostgreSQL Database | Data storage, RLS enforcement, triggers | [application/database.md](application/database.md) |
| Supabase Auth | OAuth authentication, session management | [application/authentication.md](application/authentication.md) |
| Supabase Storage | Image assets (org-assets bucket) | [application/database.md](application/database.md) |
| TanStack Start Server | SSR, server functions, middleware | [application/frontend-app.md](application/frontend-app.md) |
| RBAC System | 22 permissions, 4 org roles + GLOBAL_ADMIN | [application/permissions.md](application/permissions.md) |

## Dependencies

| Dependency | Type | Purpose | Classification |
| --- | --- | --- | --- |
| Supabase (PostgreSQL) | runtime | Database, RPCs, RLS, real-time | Confirmed |
| Supabase Auth | runtime | OAuth (Google), session management | Confirmed |
| Supabase Storage | runtime | Image asset storage with signed URLs | Confirmed |
| Lovable Cloud | runtime | Hosting, deployment, CI/CD | Confirmed |
| Google OAuth | external | User authentication provider | Confirmed |
| TanStack Start | build | SSR framework, routing, server functions | Confirmed |
| React 19 | build | UI rendering library | Confirmed |
| Tailwind CSS 4 | build | Utility-first CSS framework | Confirmed |
| shadcn/ui + Radix | build | Accessible UI component library | Confirmed |
| Zustand | build | Client-side state (tenant selection) | Confirmed |
| TanStack Query | build | Server state management, caching | Confirmed |
| React Hook Form + Zod | build | Form validation and handling | Confirmed |
| Recharts | build | Dashboard charts and visualizations | Confirmed |
| date-fns | build | Date formatting and manipulation | Confirmed |
| Sonner | build | Toast notifications | Confirmed |

## Integrations

| Integration | Direction | Contract | Documentation |
| --- | --- | --- | --- |
| Google OAuth | outbound | OAuth 2.0 authorization code flow | [application/authentication.md](application/authentication.md) |
| Supabase Platform | bidirectional | REST API + WebSocket (RPCs, Auth, Storage, Realtime) | [contracts/rest-api.md](contracts/rest-api.md) |
| Lovable Cloud | bidirectional | Git push → auto-deploy | Not Documented |

## Security

- Trust boundaries: Supabase RLS enforces tenant isolation at database level. All RPCs are SECURITY DEFINER (run as function owner, bypass RLS but validate permissions manually).
- Authn / Authz: Google OAuth via Lovable Cloud Auth → Supabase JWT → middleware validates Bearer tokens → attachSupabaseAuth middleware creates per-request authenticated client.
- Details: [security/overview.md](security/overview.md)

## Observability

| Signal type | Status |
| --- | --- |
| Logging | Implemented (console.error, error-capture module) |
| Metrics | Partial (dashboard metrics via RPC, no APM) |
| Tracing | Not Applicable (serverless) |

Details: [operations/observability.md](operations/observability.md)

## Operations

| Scenario | Runbook |
| --- | --- |
| Database schema migration | Not Documented |
| Supabase project management | Not Documented |
| Deployment rollback | Not Documented |

## Environments

| Environment | Purpose | Notes |
| --- | --- | --- |
| Development | Local development | `vite dev` with hot reload |
| Production | Live deployment | Lovable Cloud → Supabase |

## Known Limitations

| Limitation | Impact | Classification |
| --- | --- | --- |
| No real-time subscriptions yet | Numbers don't sync across tabs/browsers in real-time | Confirmed |
| No payment processing | Sales are manual-only; no automated checkout | Confirmed |
| No draw/lottery engine | Draw execution is manual/out-of-scope | Confirmed |
| No CSV export yet | Data export is manual | Confirmed |
| No email/notification system | Participants don't receive confirmations | Confirmed |
| .env committed to repo | Secrets visible in git history | Confirmed |
| Single-currency per org | Cannot handle multi-currency campaigns | Confirmed |

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture | [architecture/overview.md](architecture/overview.md) |
| Security | [security/overview.md](security/overview.md) |
| Contracts | [contracts/rest-api.md](contracts/rest-api.md) |
| Decisions | [decisions/adr-001-tech-stack.md](decisions/adr-001-tech-stack.md) |
| AI Context | [ai-context.md](ai-context.md) |
