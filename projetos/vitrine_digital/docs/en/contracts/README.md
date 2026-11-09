---
title: "Contracts"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# Contracts

> Language: EN | [Português (pt-BR)](../../pt-BR/contratos/README.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Technical contracts define explicit boundaries between system participants. Each contract specifies interaction rules that both producer and consumer must respect.

## Contract Index

| Contract | Producer | Consumer | Protocol | Documentation |
| --- | --- | --- | --- | --- |
| AI Vision Analysis | AI Provider (Lovable/OpenAI/Gemini) | TanStack Start App | REST (streaming SSE) | [architecture.md](../architecture.md) |
| AI Art Generation | AI Provider (Lovable/Gemini) | TanStack Start App | REST | [architecture.md](../architecture.md) |
| Supabase Storage | Supabase | TanStack Start App | S3-compatible | [infrastructure/supabase.md](../infrastructure/supabase.md) |
| Supabase Auth | Supabase | TanStack Start App | JWT/REST | [infrastructure/supabase.md](../infrastructure/supabase.md) |
| Edge Function (analyze-image) | Supabase Edge Function | Supabase Postgres | REST | [infrastructure/supabase.md](../infrastructure/supabase.md) |
| IAM Token Auth | Edge Function | iam_api_tokens | SHA-256 hash lookup | [architecture.md](../architecture.md) |

## Contract: AI Vision Analysis

| Field | Value |
| --- | --- |
| Producer | Lovable AI Gateway / OpenAI API / Gemini API |
| Consumer | TanStack Start App (analyzeImage server function) |
| Protocol | REST (HTTP POST) with streaming SSE |
| Input | Image (dataURL or base64) + vision prompt |
| Output | Streaming SSE with structured JSON |
| Schema | Zod validation (analysisSchema) |
| Timeout | Provider-dependent (typically 30-60s) |
| Retry | Not implemented — single attempt |
| Idempotency | Not guaranteed — re-analysis may produce different results |
| Error handling | 429 (rate limit) → error, 402 (quota) → error |

## Contract: AI Art Generation

| Field | Value |
| --- | --- |
| Producer | Lovable AI Gateway (DALL-E 3/Flux) / Gemini (Imagen 3) |
| Consumer | TanStack Start App (generateArtImageDirect server function) |
| Protocol | REST (HTTP POST) |
| Input | Reference image + art prompt + parameters (size, style) |
| Output | b64_json image data |
| Sizes | 1024x1792, 1792x1024, 1024x1024 |
| Timeout | Provider-dependent (typically 30-120s) |
| Cost | R$0.15 per generation (debited from group quota) |

## Contract: Supabase Storage

| Field | Value |
| --- | --- |
| Producer | Supabase Storage |
| Consumer | TanStack Start App, Edge Function |
| Protocol | S3-compatible REST |
| Buckets | `images` (uploads), `generated-arts` (AI output) |
| Signed URLs | 7-day (uploads), 30-day (generated arts) |
| MIME types | image/jpeg, image/png, image/webp |

## Contract: IAM Quota Check

| Field | Value |
| --- | --- |
| Producer | IAM System (server functions) |
| Consumer | AI Vision Pipeline, AI Art Generation |
| Protocol | In-process function call |
| Input | group_id |
| Output | { allowed: boolean, remaining_brl: number } |
| Cost per analysis | R$0.05 |
| Cost per art generation | R$0.15 |
| Enforcement | Pre-check before AI call + post-debit after success |

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture | [architecture.md](../architecture.md) |
| Data flow | [data-flow.md](../data-flow.md) |
| Security | [security/security.md](../security/security.md) |
