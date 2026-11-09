---
title: "Runbook — High Error Rate on Image Analysis"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
severity: "MEDIUM"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
runbook_id: "rb-high-error-rate"
---

# Runbook — High Error Rate on Image Analysis

> Language: EN | [Português (pt-BR)](../../pt-BR/operacoes/runbook.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Resolve situations where image analysis requests are failing at a higher than normal rate.

## Trigger

- Alert: Elevated error rate in ai_usage_logs (status: error)
- User report: Multiple users unable to analyze images
- Observation: Analysis status stuck in `pending` or `processing`

## Preconditions

| Precondition | How to verify |
| --- | --- |
| Access to Supabase dashboard | Login to supabase.com |
| Access to Lovable dashboard | Login to lovable.dev |
| Access to OpenAI dashboard | Login to platform.openai.com |

## Safety Notes

- Do not delete production data without backup
- Do not share API keys or secrets
- Document all changes made during investigation

## Symptoms

| Symptom | Where observed |
| --- | --- |
| Analysis status stuck in `pending` | Supabase dashboard → image_analysis |
| Error messages in ai_usage_logs | Supabase dashboard → ai_usage_logs |
| HTTP 429/402 from AI providers | Server function logs |
| Zod validation errors | Server function logs |

## Impact

| Field | Value |
| --- | --- |
| User / capability impact | Users cannot analyze images |
| Operational state | Degraded |
| Blast radius | All users attempting analysis |

## Diagnosis

1. Check ai_usage_logs for error patterns (model, group, error type)
2. Check AI provider status pages (OpenAI, Lovable, Gemini)
3. Check Supabase service status
4. Review server function logs for specific error messages

| Check | Expected | If unexpected |
| --- | --- | --- |
| AI provider status page | All operational | Wait for provider recovery |
| ai_usage_logs error rate | < 5% | Investigate root cause |
| Supabase status | Healthy | Contact Supabase support |

## Immediate Actions

1. Identify if issue is provider-specific (check which models are failing)
2. If single provider down, verify fallback is configured correctly
3. If all providers failing, check network connectivity and API keys

## Recovery

1. If provider outage: wait for provider recovery, monitor ai_usage_logs
2. If API key issue: rotate key in Supabase secrets or Lovable dashboard
3. If quota issue: increase group quota in IAM system
4. If Zod validation issue: check prompt updates and ANALYSIS_PROMPT configuration

## Validation

| Check | Expected result |
| --- | --- |
| Test image analysis | Status completes with `completed` |
| ai_usage_logs | New entries with status `success` |
| User reports | No new error reports |

## Rollback

| Condition requiring rollback | Action |
| --- | --- |
| Prompt change caused errors | Revert ANALYSIS_PROMPT to previous version |
| Code change caused errors | Revert git commit in Lovable |

| Rollback stance | Notes |
| --- | --- |
| Safe | Git revert is straightforward |

## Escalation

| Condition | Escalate to | Information to provide |
| --- | --- | --- |
| All AI providers down | Wait | Provider status pages |
| Supabase outage | Supabase support | Error logs, timeline |
| Data corruption | Manual investigation | Affected records |

## Prevention

| Follow-up | Owner | Notes |
| --- | --- | --- |
| Add health check endpoint | willian.o.jesus@gmail.com | Automated monitoring |
| Add alerting on error rate | willian.o.jesus@gmail.com | Proactive detection |
| Document failure modes | willian.o.jesus@gmail.com | Better runbooks |

## Related Alerts

| Alert | Path |
| --- | --- |
| — | — |

## Related Architecture

| Document | Path |
| --- | --- |
| Architecture | [architecture.md](../architecture.md) |
| Service profile | [service-profile.md](service-profile.md) |

## Related Contracts

| Contract | Path |
| --- | --- |
| AI Vision Analysis | [contracts/](../contracts/) |
