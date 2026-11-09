---
title: "Security"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# Security

> Language: EN | [Português (pt-BR)](../../pt-BR/seguranca/seguranca.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Security posture of the AI WhatsApp Image Analyzer — trust boundaries, authentication, authorization, data protection, and known risks.

## Trust Boundaries

| Boundary | What is protected | Controls |
| --- | --- | --- |
| Client ↔ Server | User data, API calls | HTTPS, CSRF tokens on server functions |
| Server ↔ Supabase | Database, storage | RLS policies, service role key (server-side only) |
| Server ↔ AI Providers | API keys, prompts | Server-side only, keys never exposed to client |
| IAM System | Admin operations | Role-based access (global_admin, analyst, consumer) |
| Edge Function | Database mutations | API token auth (SHA-256 hash), JWT fallback |

## Authentication

| Method | Where | Details | Classification |
| --- | --- | --- | --- |
| Supabase JWT | Client → Server | attachSupabaseAuth middleware | Confirmed |
| Supabase JWT | Edge Function | supabase.auth.getUser() | Confirmed |
| API Token | Edge Function | X-API-Key header → SHA-256 hash → iam_api_tokens lookup | Confirmed |
| CSRF Token | Server functions | Validated on handlerType=serverFn | Confirmed |
| Preview Auth | Lovable preview | Brokered preview storage validation | Confirmed |

## Authorization

| Role | Permissions | Classification |
| --- | --- | --- |
| global_admin | Full IAM management, all operations | Confirmed |
| analyst | View analysis, approve art submissions | Confirmed |
| consumer | Submit art, view own submissions | Confirmed |
| anon | Upload images, basic analysis | Confirmed (via RLS) |

### IAM Functions (Postgres)

| Function | Purpose | Security |
| --- | --- | --- |
| is_global_admin() | Check global admin role | SECURITY INVOKER, hardcoded email |
| is_admin_or_analyst() | Check admin or analyst role | SECURITY INVOKER |
| get_auth_role() | Get current user role | SECURITY INVOKER |

## Data Protection

| Data type | Storage | Protection | Classification |
| --- | --- | --- | --- |
| User images | Supabase Storage (images bucket) | RLS policies, signed URLs | Confirmed |
| Analysis results | Supabase Postgres (image_analysis) | RLS policies | Confirmed |
| API keys | Supabase secrets / env vars | Never exposed to client | Confirmed |
| Group quotas | Supabase Postgres (iam_groups) | RLS policies | Confirmed |
| API tokens | Supabase Postgres (iam_api_tokens) | SHA-256 hash stored | Confirmed |
| Generated images | Supabase Storage (generated-arts) | Signed URLs (30-day) | Confirmed |

## Secrets Management

| Secret | Location | Access | Classification |
| --- | --- | --- | --- |
| SUPABASE_SERVICE_ROLE_KEY | Supabase secrets | Server functions only | Confirmed |
| OPENAI_API_KEY | Supabase secrets | Server functions only | Confirmed |
| LOVABLE_API_KEY | Supabase secrets | Server functions only | Confirmed |
| LOVABLE_CRON_SECRET | Supabase secrets | Cron authentication | Confirmed |
| Gemini API keys | iam_groups.gemini_api_key | Per-group, server-side only | Confirmed |

**Never** commit secrets to git. **Never** log secret values.

## Known Risks

| Risk | Impact | Mitigation | Classification |
| --- | --- | --- | --- |
| Hardcoded admin email in is_global_admin() | Security bypass if email changes | Function must be updated on email change | Confirmed |
| RLS policies grant broad access to anon/authenticated | Potential unauthorized access | Supabase security hardening migrations applied | Confirmed |
| Gemini API keys stored in database | Key exposure if DB compromised | Keys are per-group, can be rotated | Confirmed |
| No rate limiting on analysis requests | Quota exhaustion, abuse | Quota system per group | Inferred |
| CSRF protection only on server functions | Potential CSRF on other endpoints | Limited attack surface | Inferred |

## Security Controls

| Control | Type | Status | Classification |
| --- | --- | --- | --- |
| HTTPS everywhere | Preventive | Implemented | Confirmed |
| RLS policies | Preventive | Implemented | Confirmed |
| CSRF tokens | Preventive | Implemented | Confirmed |
| Role-based access | Preventive | Implemented | Confirmed |
| API token hashing | Preventive | Implemented | Confirmed |
| Secret scanning | Detective | Not Documented | — |
| Audit logging | Detective | Partial (ai_usage_logs) | Inferred |

## Compliance Notes

- No PCI/DSS requirements (no payment processing)
- No HIPAA requirements (no health data)
- LGPD considerations: user images and business data may contain personal information
- Data retention: not explicitly defined

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture | [architecture.md](../architecture.md) |
| Infrastructure | [infrastructure/supabase.md](../infrastructure/supabase.md) |
| Operations | [operations/service-profile.md](../operations/service-profile.md) |
