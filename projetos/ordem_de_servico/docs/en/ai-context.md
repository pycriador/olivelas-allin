---
title: "AI Context and Progressive Navigation"
status: "ACCEPTED"
owner: "serviceforge-core"
updated: "2026-10-15"
---

# AI Context (ServiceForge Platform)

> Language: English (EN) | [Português (pt-BR)](../pt-BR/ai-context.md)
>
> Status: ACCEPTED | Version: v1.0.0-RC1

**Primary AI entrypoint** for the ServiceForge platform. Autonomous agents and engineers preparing AI prompts must start here and follow progressive links rather than loading the entire repository blindly.

---

## ⚡ Execution Chain

```text
Context → Knowledge → Relationships → Evidence → Constraints → Actions
```

---

## 📊 Progressive Context Hierarchy (Levels 0–6)

| Level | Focus | Load When | Document |
| :---: | :--- | :--- | :--- |
| **0** | Navigation rules, task boundaries, and safety constraints | Always at start of AI tasks | This file |
| **1** | System vision, business purpose, and glossary | Understanding system scope | [project-overview.md](project-overview.md) |
| **2** | Architecture, frontend and backend components | Structural changes, routing, state | [architecture/architecture.md](architecture/architecture.md) |
| **3** | Data contracts, PostgreSQL tables, schemas, and APIs | Creating or editing queries, services | [contracts/contracts.md](contracts/contracts.md) |
| **4** | Operations, build pipeline, dev scripts, deployments | Build, preview, GitHub Pages | [operations/operations.md](operations/operations.md) |
| **5** | Security, RLS, `security_invoker`, RBAC permissions | Modifying database schema or policies | [security/security.md](security/security.md) |
| **6** | End-to-end tests and runtime verification | Running tests and regression checks | `scripts/test-e2e-real-db.mjs` |

---

## 🛡️ Critical Agent Constraints

1. **Never rewrite published git history** (no force pushing, rebasing, or amending commits already pushed to connected remotes/Lovable).
2. **Data Layer Resiliency**: All persistence operations must have graceful fallbacks and reactive synchronization.
3. **View Security**: All exposed views in Supabase MUST declare `with (security_invoker = on)`.
4. **Table Standards**: Always leverage `DataTable` or follow responsive `overflow-x-auto min-w-0` and `first:pl-4 last:pr-4` to prevent cut-off columns.
