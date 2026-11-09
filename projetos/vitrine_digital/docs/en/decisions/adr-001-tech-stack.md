---
title: "ADR-001 — Tech Stack Selection"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
deciders: "willian.o.jesus@gmail.com"
---

# ADR-001 — Tech Stack Selection

> Language: EN | [Português (pt-BR)](../../pt-BR/decisoes/adr-001-stack-tecnologico.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Status

Accepted

## Date

2026-09-01

## Context

The project requires a modern web stack for an AI-powered image analysis application with:
- SSR for SEO and performance
- Real-time capabilities for analysis results
- File storage for images
- Authentication and authorization
- Rapid development iteration via Lovable

## Problem

Which technology stack best supports the project requirements while enabling rapid development and deployment through Lovable?

## Decision

Adopt the following stack:
- **Framework**: TanStack Start (SSR) + React Router
- **UI**: Tailwind CSS v4 + shadcn/ui (Radix UI)
- **Runtime**: Bun
- **Backend**: Supabase (Auth, Storage, Postgres, Edge Functions)
- **AI**: Multi-provider (Lovable gateway, OpenAI, Gemini)
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Deployment**: Lovable platform

## Alternatives Considered

| Alternative | Pros | Cons | Why not chosen |
| --- | --- | --- | --- |
| Next.js + Vercel | Mature ecosystem, large community | Heavier, Vercel lock-in | Lovable uses TanStack Start |
| Remix + Fly.io | Edge-first, lightweight | Smaller ecosystem | Lovable template choice |
| SvelteKit | Lightweight, fast | Smaller ecosystem, less Lovable support | Lovable template choice |
| Supabase + plain React | Simpler | No SSR, less SEO | Need SSR for store pages |

## Consequences

| Positive | Negative | Neutral |
| --- | --- | --- |
| Rapid development via Lovable | Lovable template dependency | TanStack Start is newer |
| Integrated backend (Supabase) | Vendor lock-in to Supabase | Multi-provider AI adds flexibility |
| Type-safe (TypeScript + Zod) | Learning curve for TanStack Start | Drizzle ORM is lightweight |
| PWA capabilities | PWA complexity | Web Share Target is browser-dependent |

## Risks

| Risk | Mitigation | Classification |
| --- | --- | --- |
| Lovable platform dependency | Code is in git, can migrate | Confirmed |
| Supabase single-region | Acceptable for current scale | Confirmed |
| TanStack Start maturity | Active development, good docs | Inferred |

## Affected Components

| Component | Impact | Documentation |
| --- | --- | --- |
| All application code | Stack choice | [architecture.md](../architecture.md) |
| Deployment pipeline | Lovable auto-deploy | [architecture.md](../architecture.md) |
| Database schema | Supabase/Drizzle | [infrastructure/supabase.md](../infrastructure/supabase.md) |

## Affected Contracts

| Contract | Impact | Documentation |
| --- | --- | --- |
| All AI contracts | Multi-provider support | [contracts/](../contracts/) |
| Supabase contracts | Auth, Storage, DB | [infrastructure/supabase.md](../infrastructure/supabase.md) |

## Traceability

```text
Architecture → Decision → Component → Contract
```

| Layer | Reference |
| --- | --- |
| Architecture | [architecture.md](../architecture.md) |
| Decision (this ADR) | ADR-001 |
| Component | TanStack Start App |
| Contract | All contracts |
| Implementation evidence | package.json, vite.config.ts |

## Related Decisions

| ADR | Relationship |
| --- | --- |
| — | — |

## References

| Reference | Location |
| --- | --- |
| Architecture doc | [architecture.md](../architecture.md) |
| Lovable project | https://lovable.dev/projects/6949f5e1-5874-47a3-b30e-cfb703685ed6 |
| Live app | https://ai-wpp-image-analyzer.lovable.app |
