---
title: "Templates"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-11"
updated: "2026-09-11"
version: "1.0"
---

# Templates

> Language: EN | [Português (pt-BR)](../../pt-BR/templates/README.md)
>
> Status: ACCEPTED

Reusable document templates for this project. Copy a template into the appropriate category, replace placeholders, and set document lifecycle status in YAML frontmatter.

## Frontmatter Requirement

Every content document must start with YAML frontmatter. Required fields:

| Field | Required | Notes |
| --- | --- | --- |
| `title` | Yes | Document title |
| `status` | Yes | Lifecycle: `DRAFT`, `ACCEPTED`, `DEPRECATED`, etc. |
| `owner` | Yes | Team or role |
| `updated` | Yes | Last content update (`YYYY-MM-DD`) |
| `created` | No | First publish date |
| `review_date` | No | Next or last review target |
| `version` | No | Document version string |

Keep the language switcher blockquote after the H1. Do not put lifecycle metadata in the blockquote.

For ADRs: frontmatter `status` is document lifecycle; the `## Status` section is decision status (`Proposed` / `Accepted` / ...). They are independent.

## Available Templates

| Template | File | Use for |
| --- | --- | --- |
| Project Overview | [project-overview.md](project-overview.md) | System purpose, scope, and map |
| Architecture | [architecture.md](architecture.md) | Consolidated architecture document |
| System Context | [system-context.md](system-context.md) | System in its ecosystem |
| Component | [component.md](component.md) | Single component operational/detail view |
| Data Flow | [data-flow.md](data-flow.md) | One meaningful data path |
| Contract | [contract.md](contract.md) | APIs, events, messages, files, commands, and other interfaces |
| Service Profile | [service-profile.md](service-profile.md) | Service operational identity card |
| Runbook | [runbook.md](runbook.md) | Operational procedure |
| Security | [security.md](security.md) | Security posture overview |
| ADR | [adr.md](adr.md) | Architecture decision record |
| AI Task Context | [ai-task-context.md](ai-task-context.md) | Context pack for an AI task |
| Claim | [claim.md](claim.md) | Single evidence-bound technical claim |

## Usage Rules

1. Keep sections even when empty — mark `Not applicable` or `Unknown` instead of deleting structure arbitrarily.
2. Do not treat every section as mandatory content for every project.
3. Never fill placeholders with invented project facts.
4. Set frontmatter `status: "DRAFT"` until reviewed; move to `ACCEPTED` after review.
5. Do not invent metrics, targets, architectural patterns, SLOs, alerts, DR, or runbook commands without evidence.
6. Never embed secrets in documentation.