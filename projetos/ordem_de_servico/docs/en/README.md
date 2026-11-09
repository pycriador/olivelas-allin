---
title: "ServiceForge Engineering Documentation (EN)"
status: "ACCEPTED"
owner: "serviceforge-core"
updated: "2026-10-15"
---

# ServiceForge Platform Documentation (EN)

> Language: English (EN) | [Português (pt-BR)](../pt-BR/README.md)
>
> Status: ACCEPTED | Platform Version: v1.0.0-RC1

Welcome to the official engineering documentation for the **ServiceForge** platform. This documentation strictly follows the **Engineering Documentation Standard v1.0**, providing clear architecture, verified data contracts, reproducible operations, and progressive context for human engineers and autonomous AI agents.

---

## 🧭 Navigation Index

| Document | Focus | Status |
| :--- | :--- | :--- |
| [AI Context](ai-context.md) | AI primary entrypoint with Level 0–6 hierarchy | `ACCEPTED` |
| [Project Overview](project-overview.md) | Purpose, scope, non-goals, and core modules | `ACCEPTED` |
| [Architecture](architecture/architecture.md) | C4 diagrams, components, data flow, SSR and SPA | `ACCEPTED` |
| [Contracts](contracts/contracts.md) | PostgreSQL / Supabase schemas, types, and APIs | `ACCEPTED` |
| [Operations](operations/operations.md) | Build, development, static SPA deployment (GitHub Pages) | `ACCEPTED` |
| [Security](security/security.md) | Row Level Security (RLS), security_invoker views, RBAC, audit log | `ACCEPTED` |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run local development server (port 8080)
npm run dev

# Production build validation
npm run build

# Generate static SPA distribution for GitHub Pages
npm run build:gh-pages
```
