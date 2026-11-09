---
title: "System Context"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# System Context

> Language: EN | [Português (pt-BR)](../pt-BR/contexto-do-sistema.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Defines the boundaries of the AI WhatsApp Image Analyzer system, identifying users, external systems, and their interactions.

## System Context Diagram

```mermaid
C4Context
    title AI WhatsApp Image Analyzer - System Context

    Person(user, "End User", "Shares promotional images via WhatsApp")
    Person(admin, "Global Admin", "Manages IAM system, groups, quotas")
    Person(analyst, "Analyst", "Views analysis, approves art")
    Person(consumer, "Consumer", "Submits art for approval")

    System(app, "AI WhatsApp Image Analyzer", "Analyzes images using AI, extracts structured data, generates art")

    System_Ext(whatsapp, "WhatsApp", "Source of promotional images")
    System_Ext(lovable, "Lovable AI Gateway", "Primary AI provider (GPT-5, GPT-4.1, Gemini)")
    System_Ext(openai, "OpenAI API", "Fallback AI provider")
    System_Ext(gemini, "Google Gemini API", "Direct Gemini access, Imagen 3")
    System_Ext(supabase, "Supabase", "Auth, Storage, Database, Edge Functions")

    Rel(user, app, "uploads images, views results")
    Rel(admin, app, "manages IAM")
    Rel(analyst, app, "views analysis")
    Rel(consumer, app, "submits art")
    Rel(user, whatsapp, "shares images")
    Rel(app, supabase, "stores data, authenticates")
    Rel(app, lovable, "calls AI models")
    Rel(app, openai, "calls AI models (fallback)")
    Rel(app, gemini, "calls Gemini, Imagen 3")
```

## Users

| User | Description | Primary interaction |
| --- | --- | --- |
| End User | Shares promotional images via WhatsApp or browser | Upload image, view analysis |
| Global Admin | Manages the IAM system | Groups, users, tokens, quotas |
| Analyst | Views analysis results | Review analysis, approve art |
| Consumer | Submits art for moderation | Submit art, view status |

## External Systems

| System | Purpose | Integration type | Criticality |
| --- | --- | --- | --- |
| WhatsApp | Source of promotional images | Web Share Target (indirect) | High |
| Supabase | Auth, Storage, Database, Edge Functions | REST API | Critical |
| Lovable AI Gateway | Primary AI provider | REST API | High |
| OpenAI API | Fallback AI provider | REST API | Medium |
| Google Gemini API | Direct Gemini, Imagen 3 | REST API | Medium |

## Data Stores

| Store | Purpose | Technology | Classification |
| --- | --- | --- | --- |
| image_analysis | Analysis results, metadata | Supabase Postgres | Confirmed |
| iam_groups | Groups with quotas | Supabase Postgres | Confirmed |
| iam_users | Users with roles | Supabase Postgres | Confirmed |
| iam_api_tokens | API tokens for Edge Functions | Supabase Postgres | Confirmed |
| iam_prompts | AI prompts (vision, art) | Supabase Postgres | Confirmed |
| ai_usage_logs | Cost tracking per model/group | Supabase Postgres | Confirmed |
| art_submissions | Art moderation queue | Supabase Postgres | Confirmed |
| images | Uploaded images | Supabase Storage | Confirmed |
| generated-arts | AI-generated images | Supabase Storage | Confirmed |

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture | [architecture.md](architecture.md) |
| Data flow | [data-flow.md](data-flow.md) |
| Infrastructure | [infrastructure/supabase.md](infrastructure/supabase.md) |
