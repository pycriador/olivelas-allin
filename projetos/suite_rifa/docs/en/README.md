---
title: "RaffleHub Documentation"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
---

# RaffleHub Documentation

> Language: EN | [Português (pt-BR)](../pt-BR/README.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

Central documentation index for RaffleHub — a multi-tenant SaaS platform for managing raffles (rifas) in the Brazilian market.

## Project Overview

| Field | Value |
| --- | --- |
| Purpose | Multi-tenant raffle management SaaS |
| Market | Brazil (pt-BR, BRL, PIX) |
| Stack | React 19, TypeScript, TanStack Start, Supabase, Cloudflare Workers |
| Repository | [pycriador-org/raffle-suite-hub](https://github.com/pycriador-org/raffle-suite-hub) |

## Documentation Inventory

### Architecture

| Document | Category | Status | Owner | Updated |
| --- | --- | --- | --- | --- |
| [overview.md](architecture/overview.md) | Architecture | ACCEPTED | rafflehub | 2026-08-18 |
| [data-model.md](architecture/data-model.md) | Architecture | ACCEPTED | rafflehub | 2026-08-18 |
| [components.md](architecture/components.md) | Architecture | ACCEPTED | rafflehub | 2026-08-18 |

### Application

| Document | Category | Status | Owner | Updated |
| --- | --- | --- | --- | --- |
| [campaigns.md](application/campaigns.md) | Application | ACCEPTED | rafflehub | 2026-08-18 |
| [numbers.md](application/numbers.md) | Application | ACCEPTED | rafflehub | 2026-08-18 |
| [participants.md](application/participants.md) | Application | ACCEPTED | rafflehub | 2026-08-18 |
| [payments.md](application/payments.md) | Application | ACCEPTED | rafflehub | 2026-08-18 |
| [auth.md](application/auth.md) | Application | ACCEPTED | rafflehub | 2026-08-18 |
| [permissions.md](application/permissions.md) | Application | ACCEPTED | rafflehub | 2026-08-18 |

### Contracts

| Document | Category | Status | Owner | Updated |
| --- | --- | --- | --- | --- |
| [rpc-functions.md](contracts/rpc-functions.md) | Contracts | ACCEPTED | rafflehub | 2026-08-18 |
| [api-routes.md](contracts/api-routes.md) | Contracts | ACCEPTED | rafflehub | 2026-08-18 |

### Operations

| Document | Category | Status | Owner | Updated |
| --- | --- | --- | --- | --- |
| [deployment.md](operations/deployment.md) | Operations | ACCEPTED | rafflehub | 2026-08-18 |
| [environment.md](operations/environment.md) | Operations | ACCEPTED | rafflehub | 2026-08-18 |
| [migrations.md](operations/migrations.md) | Operations | ACCEPTED | rafflehub | 2026-08-18 |

### Security

| Document | Category | Status | Owner | Updated |
| --- | --- | --- | --- | --- |
| [overview.md](security/overview.md) | Security | ACCEPTED | rafflehub | 2026-08-18 |

## Progressive Disclosure Chains

```text
Architecture → Contracts → Operations → Recovery
Architecture → Trust Boundaries → Assets → Threats → Controls → Operations → Response
```

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture overview | [architecture/overview.md](architecture/overview.md) |
| Data model | [architecture/data-model.md](architecture/data-model.md) |
| Security model | [security/overview.md](security/overview.md) |
| Deployment | [operations/deployment.md](operations/deployment.md) |
