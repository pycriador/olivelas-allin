---
title: "Service Profile"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
service_id: "ai-wpp-image-analyzer"
criticality: "High"
---

# Service Profile

> Language: EN | [Português (pt-BR)](../../pt-BR/operacoes/perfil-do-servico.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Operational identity card for the AI WhatsApp Image Analyzer service.

## Scope

| In scope | Out of scope |
| --- | --- |
| Image analysis pipeline | Real-time streaming |
| Art generation pipeline | Payment processing |
| IAM management | Multi-region deployment |
| Store landing page | Custom ML training |
| PWA Web Share Target | Native mobile app |

## Ownership

| Role | Owner | Notes |
| --- | --- | --- |
| Service / product | willian.o.jesus@gmail.com | Global admin |
| Technical | willian.o.jesus@gmail.com | Full-stack development |
| Operational / on-call | willian.o.jesus@gmail.com | Solo developer |
| Escalation | willian.o.jesus@gmail.com | Single point of contact |

## Criticality

| Field | Value |
| --- | --- |
| Level | High |
| Rationale | Primary product for AI-powered image analysis |
| User / business impact if down | Users cannot analyze images or generate art |

## Architecture Links

| Concern | Link |
| --- | --- |
| Architecture overview | [architecture.md](../architecture.md) |
| Failure domains | [architecture.md](../architecture.md) — Failure Domains |
| Dependency map | [architecture.md](../architecture.md) — Dependencies |

## Dependencies

| Dependency | Type | Criticality | Failure impact | Detection | Mitigation / recovery |
| --- | --- | --- | --- | --- | --- |
| Supabase | runtime | Critical | Complete outage | Health check | Manual investigation |
| Lovable AI Gateway | runtime | High | Analysis unavailable | HTTP error codes | Fallback to OpenAI/Gemini |
| OpenAI API | runtime | Medium | Reduced providers | HTTP error codes | Use other providers |
| Gemini API | runtime | Medium | No Gemini features | HTTP error codes | Use other providers |

## Contracts (Reliability-Relevant)

| Contract | Timeout | Retry | Idempotency | Notes |
| --- | --- | --- | --- | --- |
| AI Vision Analysis | 30-60s | No | No | Different results possible |
| AI Art Generation | 30-120s | No | No | Different images possible |
| Supabase Storage | 10s | No | Yes | Upload/download |
| Supabase Auth | 5s | No | Yes | JWT validation |

## Service Levels

| SLI | SLO | Window | Error budget | Classification |
| --- | --- | --- | --- | --- |
| Analysis success rate | Not Defined | — | — | Unknown |
| Analysis latency | Not Defined | — | — | Unknown |
| Art generation success | Not Defined | — | — | Unknown |

## Failure Modes (Summary)

| Failure mode | Impact | Detection | Runbook / recovery |
| --- | --- | --- | --- |
| AI provider outage | Analysis/generation unavailable | HTTP errors | Fallback to other providers |
| Supabase outage | Complete application failure | Health check | Manual investigation |
| Quota exhaustion | Users cannot analyze/generate | Quota check error | Increase group quota |
| Invalid AI response | Analysis fails silently | Zod validation error | Retry or investigate prompt |
| Storage full | New uploads fail | Upload error | Clean old files or increase quota |

## Observability

| Signal type | Status | Notes / link |
| --- | --- | --- |
| Metrics | Partial | ai_usage_logs tracks cost per model/group |
| Logs | Partial | Console.log in server functions |
| Traces | Not Documented | — |
| Health checks | Not Documented | — |
| Alerts | Not Documented | — |

## Operational State

| How state is determined | Healthy / Degraded / Unavailable signals |
| --- | --- |
| Application accessible | Healthy: page loads, Degraded: slow, Unavailable: 500 |

## Deploy and Change

| Topic | Link / notes |
| --- | --- |
| Deploy / validate | Lovable auto-deploy on commit to connected branch |
| Rollback stance | Safe — revert git commit |
| Maintenance | Manual via Lovable editor or git |

## Recovery

| Topic | Status | Link |
| --- | --- | --- |
| Backup / restore | Supabase managed backups | — |
| RPO / RTO | Not Defined | — |
| Disaster recovery | Not Defined | — |

## Related Runbooks and Incidents

| Artifact | ID / path |
| --- | --- |
| Runbooks | [runbook.md](runbook.md) |
| Troubleshooting | — |
| Recent material incidents | None recorded |

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture | [architecture.md](../architecture.md) |
| Contracts | [contracts/](../contracts/) |
| Security | [security/security.md](../security/security.md) |
