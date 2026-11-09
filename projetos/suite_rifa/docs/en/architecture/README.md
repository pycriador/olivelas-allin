---
title: "Architecture Documentation"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
---

# Architecture Documentation

> Language: EN | [Português (pt-BR)](../../pt-BR/architecture/README.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

Architecture documentation covers system structure, boundaries, communication patterns, data flow, and trade-offs.

## Documents

| Document | Purpose |
| --- | --- |
| [overview.md](overview.md) | System architecture, tech stack, layered design, dependency map |
| [data-model.md](data-model.md) | Database schema, tables, enums, relationships, multi-tenancy |
| [components.md](components.md) | Frontend routes, services, hooks, components, server routes |

## Progressive Disclosure

```text
Context → System → Components → Interfaces → Implementation
```

| Level | Document |
| --- | --- |
| System overview | [overview.md](overview.md) |
| Data model | [data-model.md](data-model.md) |
| Component map | [components.md](components.md) |
