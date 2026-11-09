---
title: "AI WhatsApp Image Analyzer"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# AI WhatsApp Image Analyzer

> Language: EN | [Português (pt-BR)](../pt-BR/visao-geral.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

AI WhatsApp Image Analyzer is a web application that uses multimodal AI models to analyze images shared via WhatsApp. It automatically extracts structured information (business names, contacts, services, products, prices, addresses) from promotional images and returns a complete JSON representation.

## Problem

Promotional images shared via WhatsApp contain valuable business information that is locked in pixel format. Manual extraction is time-consuming, error-prone, and does not scale. This application automates the extraction, making image content searchable, structured, and actionable.

## Scope

| In scope | Notes |
| --- | --- |
| Image upload via drag-and-drop and file picker | JPEG, PNG, WebP |
| PWA Web Share Target | Receive images shared from WhatsApp |
| AI-powered image analysis | GPT-5, GPT-4.1, Gemini 2.5 Flash via Lovable gateway |
| Structured JSON output | OCR, object detection, contact extraction |
| IAM system with quotas | Global admin, analyst, consumer roles |
| AI-generated art from analyzed images | DALL-E 3, Flux, Imagen 3 |
| Store landing page | WhatsApp-based business portfolio |
| Art moderation queue | Consumer submissions with approval workflow |

## Non-Goals

| Non-goal | Rationale |
| --- | --- |
| Real-time video analysis | Scope limited to static images |
| Multi-language OCR beyond PT/EN | Current models handle PT/EN sufficiently |
| Payment processing | Quotas managed in BRL via IAM, no billing integration |
| Mobile native app | PWA covers mobile use cases via Web Share Target |

## Users / Consumers

| User / consumer | Need |
| --- | --- |
| End users (WhatsApp) | Share promotional images and receive structured analysis |
| Business owners | Display portfolio via store landing page |
| Global admins | Manage groups, users, tokens, prompts, quotas |
| Analysts | View analysis results, approve art submissions |
| Consumers | Submit art for approval, view own submissions |

## Architecture

- Overview: TanStack Start SSR application with Supabase backend, multi-provider AI integration (Lovable gateway, OpenAI, Gemini), and PWA capabilities.
- Details: [architecture.md](architecture.md)

## Components

| Component | Responsibility | Documentation |
| --- | --- | --- |
| TanStack Start App | SSR routing, UI, server functions | [architecture.md](architecture.md) |
| Supabase Backend | Auth, Storage, Postgres, Edge Functions | [infrastructure/supabase.md](infrastructure/supabase.md) |
| AI Vision Pipeline | Image analysis, JSON extraction, validation | [architecture.md](architecture.md) |
| AI Art Generation | Image generation from analyzed content | [architecture.md](architecture.md) |
| IAM System | Roles, groups, quotas, API tokens | [architecture.md](architecture.md) |
| Store Landing Page | Business portfolio display | [architecture.md](architecture.md) |

## Dependencies

| Dependency | Type | Purpose | Classification |
| --- | --- | --- | --- |
| Supabase | runtime | Auth, Storage, Database, Edge Functions | Confirmed |
| Lovable AI Gateway | runtime | Vision and image generation models | Confirmed |
| OpenAI API | runtime | Fallback vision and image generation | Confirmed |
| Google Gemini API | runtime | Direct vision and Imagen 3 | Confirmed |
| TanStack Start | build | SSR framework | Confirmed |
| Tailwind CSS v4 | build | UI styling | Confirmed |
| shadcn/ui | build | UI components | Confirmed |
| Drizzle ORM | build | Database migrations | Confirmed |

## Integrations

| Integration | Direction | Contract | Documentation |
| --- | --- | --- | --- |
| Lovable AI Gateway | outbound | REST (chat completions, images) | [contracts/](contracts/) |
| OpenAI API | outbound | REST (chat completions, images) | [contracts/](contracts/) |
| Gemini API | outbound | REST (generateContent, predict) | [contracts/](contracts/) |
| Supabase Storage | bidirectional | S3-compatible (images bucket) | [infrastructure/supabase.md](infrastructure/supabase.md) |
| Supabase Auth | bidirectional | JWT-based authentication | [infrastructure/supabase.md](infrastructure/supabase.md) |
| WhatsApp | outbound | wa.me links | [architecture.md](architecture.md) |

## Security

- Trust boundaries: Supabase RLS policies, IAM role-based access, CSRF protection on server functions
- Authn / Authz: Supabase JWT auth, API token hash-based auth (Edge Functions), role-based IAM (global_admin / analyst / consumer)
- Details: [security/security.md](security/security.md)

## Observability

| Signal type | Status |
| --- | --- |
| Logging | Partial — console.log in server functions, Supabase Edge Function logs |
| Metrics | Partial — ai_usage_logs table tracks cost per model/group |
| Tracing | Not Documented |

## Operations

| Scenario | Runbook |
| --- | --- |
| High error rate on image analysis | [operations/runbook.md](operations/runbook.md) |
| AI quota exhaustion | [operations/service-profile.md](operations/service-profile.md) |

## Environments

| Environment | Purpose | Notes |
| --- | --- | --- |
| Lovable Preview | Development/preview | Auto-deployed from Lovable editor |
| Production | Live application | ai-wpp-image-analyzer.lovable.app |
| Static (Vitrine Digital) | Standalone HTML/CSS/JS | Deployable to any CDN |

## Known Limitations

| Limitation | Impact | Classification |
| --- | --- | --- |
| Single Supabase project | No multi-region failover | Confirmed |
| AI model availability depends on external providers | Analysis unavailable during provider outages | Confirmed |
| Quota management is per-group, not per-user | Large groups may exhaust quotas faster | Confirmed |
| No webhook-based real-time notifications | Users must poll for analysis completion | Inferred |

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture | [architecture.md](architecture.md) |
| Security | [security/security.md](security/security.md) |
| Contracts | [contracts/](contracts/) |
| Operations | [operations/](operations/) |
| Decisions | [decisions/](decisions/) |
| Infrastructure | [infrastructure/supabase.md](infrastructure/supabase.md) |
