---
title: "Supabase Infrastructure"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# Supabase Infrastructure

> Language: EN | [Português (pt-BR)](../../pt-BR/infraestrutura/supabase.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Documents the Supabase project configuration, database schema, storage, Edge Functions, and security hardening.

## Project

| Field | Value |
| --- | --- |
| Project ID | iukirkelywzlqkxlcyfk |
| Region | Not specified |
| URL | Configured via SUPABASE_URL env var |

## Database Schema

### Core Tables

| Table | Purpose | Classification |
| --- | --- | --- |
| image_analysis | Image analysis results and metadata | Confirmed |
| iam_groups | IAM groups with quotas | Confirmed |
| iam_users | IAM users with roles | Confirmed |
| iam_api_tokens | API tokens for Edge Function auth | Confirmed |
| iam_prompts | AI prompts (vision, art, custom) | Confirmed |
| ai_usage_logs | Cost tracking per model/group | Confirmed |
| art_submissions | Art moderation queue | Confirmed |

### Table: image_analysis

| Column | Type | Default | Notes |
| --- | --- | --- | --- |
| id | uuid | gen_random_uuid() | Primary key |
| created_at | timestamptz | now() | Indexed |
| image_url | text | — | Signed URL |
| image_path | text | — | Storage path |
| image_type | text | — | MIME type |
| business_name | text | — | Extracted name |
| category | text | — | Image category |
| title | text | — | Extracted title |
| summary | text | — | AI summary |
| searchable_text | text | — | Full-text search |
| keywords | text[] | — | Extracted keywords |
| confidence | numeric | — | 0-1 range |
| analysis | jsonb | — | Full structured JSON |
| phash | text | — | Perceptual hash |
| processing_version | text | — | Prompt/model version |
| model_used | text | — | AI model identifier |
| status | text | 'pending' | pending/processing/completed/failed |
| error_message | text | — | Error details |

### Table: iam_groups

| Column | Type | Default | Notes |
| --- | --- | --- | --- |
| id | uuid | gen_random_uuid() | Primary key |
| name | text | — | Group name |
| description | text | — | Group description |
| quota_brl | numeric | 200 | Monthly BRL quota |
| used_brl | numeric | 0 | Current usage |
| gemini_api_key | text | — | Per-group Gemini key |
| gemini_model | text | 'gemini-2.5-flash' | Gemini model |
| created_at | timestamptz | now() | — |
| updated_at | timestamptz | now() | Auto-updated |

### Table: iam_users

| Column | Type | Default | Notes |
| --- | --- | --- | --- |
| id | uuid | gen_random_uuid() | Primary key |
| email | text | — | Unique |
| role | text | — | CHECK: global_admin/analyst/consumer |
| group_ids | uuid[] | — | Associated groups |
| custom_quota_brl | numeric | — | Per-user override |
| created_at | timestamptz | now() | — |
| updated_at | timestamptz | now() | Auto-updated |

## Storage Buckets

| Bucket | Purpose | Signed URL expiry | Classification |
| --- | --- | --- | --- |
| images | User-uploaded images | 7 days | Confirmed |
| generated-arts | AI-generated images | 30 days | Confirmed |

## Edge Functions

| Function | Purpose | Auth | Classification |
| --- | --- | --- | --- |
| analyze-image | Server-side image analysis | JWT or API token | Confirmed |

### Edge Function: analyze-image

| Field | Value |
| --- | --- |
| Runtime | Deno (edge-runtime) |
| Input | { id, path, imageUrl } |
| Auth | JWT Bearer OR X-API-Key (SHA-256 hash) |
| AI Provider | OpenAI chat completions OR Lovable gateway |
| Default model | gpt-4o / openai/gpt-4.1-mini |
| Max tokens | 4096 |
| Response format | json_object |
| Processing version | v1 |

## Security Hardening

| Function | Purpose | Security |
| --- | --- | --- |
| is_global_admin() | Check admin role | SECURITY INVOKER, SET search_path = public |
| is_admin_or_analyst() | Check admin/analyst | SECURITY INVOKER, SET search_path = public |
| get_auth_role() | Get user role | SECURITY INVOKER, SET search_path = public |

All functions:
- REVOKE from public/anon
- GRANT to authenticated/service_role
- Hardcoded email for global admin check

## Migrations

| Migration | Purpose | Classification |
| --- | --- | --- |
| 20260910_iam_system.sql | IAM tables (groups, users, tokens) | Confirmed |
| 20260910_prompts_and_usage_logs.sql | Prompts and usage tracking | Confirmed |
| 20260910_complete_iam_and_client_system.sql | Art submissions, consolidation | Confirmed |
| 20260910_security_hardening.sql | Security functions, RLS hardening | Confirmed |
| 0000_create_image_analysis.sql | Core analysis table | Confirmed |
| 0001_images_bucket_policies.sql | Storage policies | Confirmed |
| 0002_add_gemini_model_to_iam_groups.sql | Gemini model column | Confirmed |
| 0002_add_embeddings_and_search.sql | Vector extension, FTS index | Confirmed |

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture | [architecture.md](../architecture.md) |
| Security | [security/security.md](../security/security.md) |
| Contracts | [contracts/](../contracts/) |
