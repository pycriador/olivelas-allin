---
title: "Data Flow"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# Data Flow

> Language: EN | [Português (pt-BR)](../pt-BR/fluxo-de-dados.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Describes the primary data flows through the AI WhatsApp Image Analyzer system.

## Flow 1: Image Analysis (Primary)

```mermaid
sequenceDiagram
    participant U as User
    participant App as TanStack Start
    participant Stor as Supabase Storage
    participant AI as AI Provider
    participant DB as Supabase Postgres

    U->>App: Upload image (drag-drop / share target)
    App->>Stor: Upload to images bucket
    Stor-->>App: Image path
    App->>App: Compute pHash (8x8)
    App->>DB: INSERT image_analysis (status: pending)
    App->>App: analyzeImage(serverFn)
    App->>Stor: Download image
    Stor-->>App: Image data
    App->>App: Convert to dataURL
    App->>AI: Vision prompt + image
    AI-->>App: Streaming SSE response
    App->>App: Parse JSON (regex extraction)
    App->>App: Validate against Zod schema
    App->>DB: UPDATE image_analysis (status: completed)
    App->>DB: INSERT ai_usage_logs (cost: R$0.05)
    App-->>U: Display analysis result
```

### Data Entities

| Entity | Source | Destination | Format |
| --- | --- | --- | --- |
| Image file | User device | Supabase Storage | JPEG/PNG/WebP |
| Signed URL | Supabase Storage | App server | URL (7-day expiry) |
| pHash | App computation | image_analysis.phash | 8x8 binary matrix |
| Vision prompt | iam_prompts / ANALYSIS_PROMPT | AI provider | String |
| AI response | AI provider | App server | Streaming SSE JSON |
| Analysis result | App validation | image_analysis.analysis | JSONB |
| Usage log | App server | ai_usage_logs | Row (cost, model, status) |

### Schema: image_analysis

| Column | Type | Purpose |
| --- | --- | --- |
| id | uuid | Primary key |
| image_url | text | Signed URL of image |
| image_path | text | Storage path |
| image_type | text | MIME type |
| business_name | text | Extracted business name |
| category | text | Image category |
| title | text | Extracted title |
| summary | text | AI-generated summary |
| searchable_text | text | Full-text search content |
| keywords | text[] | Extracted keywords |
| confidence | numeric | AI confidence (0-1) |
| analysis | jsonb | Full structured JSON |
| phash | text | Perceptual hash |
| processing_version | text | Prompt/model version |
| model_used | text | AI model identifier |
| status | text | pending/processing/completed/failed |
| error_message | text | Error details if failed |
| created_at | timestamptz | Record creation time |

## Flow 2: Art Generation

```mermaid
sequenceDiagram
    participant U as User
    participant App as TanStack Start
    participant AI as AI Provider
    participant Stor as Supabase Storage
    participant DB as Supabase Postgres

    U->>App: Request art generation
    App->>DB: SELECT analysis (reference image)
    App->>AI: Generate image (DALL-E 3/Flux/Imagen 3)
    AI-->>App: b64_json image data
    App->>Stor: Upload to generated-arts/{uuid}.jpg
    Stor-->>App: Image path
    App->>Stor: Create signed URL (30-day)
    Stor-->>App: Signed URL
    App->>DB: UPDATE analysis.image_gallery
    App->>DB: INSERT ai_usage_logs (cost: R$0.15)
    App-->>U: Display generated art
```

## Flow 3: IAM Management

```mermaid
sequenceDiagram
    participant A as Admin
    participant App as TanStack Start
    participant DB as Supabase Postgres

    A->>App: Manage groups/users/tokens
    App->>DB: CRUD iam_groups / iam_users / iam_api_tokens
    DB-->>App: Updated records
    App-->>A: Confirmation + updated view
```

## Flow 4: Art Moderation

```mermaid
sequenceDiagram
    participant C as Consumer
    participant A as Analyst
    participant App as TanStack Start
    participant DB as Supabase Postgres

    C->>App: Submit art (ConsumerSubmissionModal)
    App->>DB: INSERT art_submissions (status: pending)
    A->>App: View approval queue
    App->>DB: SELECT art_submissions (pending)
    A->>App: Approve/Reject
    App->>DB: UPDATE art_submissions (status: approved/rejected)
```

## Flow 5: Store Landing Page

```mermaid
sequenceDiagram
    participant V as Visitor
    participant App as TanStack Start
    participant DB as Supabase Postgres

    V->>App: Access /anuncio/:id
    App->>DB: SELECT analysis by ID
    DB-->>App: Analysis record
    App-->>V: Render StoreLandingPage with portfolio
    V->>V: Click WhatsApp button
```

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture | [architecture.md](architecture.md) |
| System context | [system-context.md](system-context.md) |
| Contracts | [contracts/](contracts/) |
