---
title: "AI Context"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# AI Context

> Language: EN | [Português (pt-BR)](../pt-BR/contexto-ia.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Entry point for AI agents and humans consuming this documentation. Start here and follow links — do not load the entire corpus.

## Start Sequence

1. Read this document → understand scope and boundaries
2. Follow navigation to required depth
3. Apply answering rules and safety constraints

## Project Context

| Field | Value |
| --- | --- |
| Project | AI WhatsApp Image Analyzer |
| Type | Web application (SSR + PWA) |
| Stack | TanStack Start, React, TypeScript, Tailwind CSS v4, Supabase |
| Runtime | Bun |
| Primary function | AI-powered image analysis and structured data extraction |
| Deployment | Lovable (ai-wpp-image-analyzer.lovable.app) |

## Knowledge Map

| Level | Document | Purpose |
| --- | --- | --- |
| 0 — Entry | This file (ai-context.md) | Navigation, scope, boundaries |
| 1 — Context | [project-overview.md](project-overview.md) | Why the project exists, scope, users |
| 2 — Architecture | [architecture.md](architecture.md) | System structure, components, relationships |
| 3 — Contracts | [contracts/](contracts/) | API boundaries, data schemas |
| 4 — Operations | [operations/service-profile.md](operations/service-profile.md) | Operational identity, failure modes |
| 5 — Security | [security/security.md](security/security.md) | Trust boundaries, auth, controls |

## Core Rules

| Rule | Reference |
| --- | --- |
| Architecture progressive disclosure | Context → System → Components → Interfaces → Implementation |
| Contracts as boundaries | Architecture → Component → Contract → Producer/Consumer |
| Operations as loop | Operate → Observe → Detect → Diagnose → Respond → Recover → Learn → Improve |
| Security as loop | Assets → Threats → Risk → Requirements → Controls → Evidence → Monitoring → Response → Review |
| AI-ready metadata | Context → Knowledge → Relationships → Evidence → Constraints → Actions |
| Claim classification | Confirmed / Inferred / Unknown / Proposed |
| No invented facts | Prefer Unknown over invented SLOs, metrics, or secrets |

## Entry Files

| File | Purpose |
| --- | --- |
| AGENTS.md | Coding agent entry (stack, commands, boundaries) |
| CLAUDE.md | Claude Code entry |
| ai-context.md | This file — AI-ready documentation entry |

## Non-Goals

- No RAG, embeddings, or vector DB
- No MCP wiring
- No chatbot UX specification
- No search product specification

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture | [architecture.md](architecture.md) |
| Security | [security/security.md](security/security.md) |
| Contracts | [contracts/](contracts/) |
| Operations | [operations/](operations/) |
