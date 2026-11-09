---
title: "Runbook Name"
status: "DRAFT"
owner: "team"
severity: "MEDIUM"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
review_date: "YYYY-MM-DD"
version: "1.0"
runbook_id: "rb-short-name"
---

# Runbook

> Language: EN | [Português (pt-BR)](../../pt-BR/templates/runbook.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

Executable operational procedure. Use project-evidenced steps only. Never invent commands, infrastructure, paths, or permissions. Never embed secrets.

## Purpose

<!-- What operational outcome this runbook achieves. -->

## Trigger

<!-- What starts this runbook: alert, symptom, request, scheduled check. -->

## Preconditions

| Precondition | How to verify |
| --- | --- |
| | |

## Safety Notes

- Confirm environment and target before acting.
- Call out **destructive** or **irreversible** steps before those steps.
- Rollback is not always safe — see Rollback section.
- Document command/config **names** only; never secret values.
- Do not invent tooling, paths, cluster names, or permissions.

## Symptoms

| Symptom | Where observed |
| --- | --- |
| | |

## Impact

| Field | Value |
| --- | --- |
| User / capability impact | |
| Operational state | Healthy / Degraded / Unavailable / Recovering / Maintenance / Unknown |
| Blast radius | |

## Diagnosis

1. <!-- step -->
2. <!-- step -->
3. <!-- step -->

| Check | Expected | If unexpected |
| --- | --- | --- |
| | | |

## Immediate Actions

1. <!-- stop-the-bleeding / containment -->
2. <!-- step -->

## Recovery

1. <!-- restore to acceptable operational state -->
2. <!-- step -->
3. <!-- step -->

## Validation

| Check | Expected result |
| --- | --- |
| | |

## Rollback

| Condition requiring rollback | Action |
| --- | --- |
| | |

| Rollback stance | Notes |
| --- | --- |
| Safe / partial / irreversible / Unknown | |

## Escalation

| Condition | Escalate to | Information to provide |
| --- | --- | --- |
| | | |

## Prevention

| Follow-up | Owner | Notes |
| --- | --- | --- |
| | | |

## Related Alerts

| Alert | Path |
| --- | --- |
| | |

## Related Architecture

| Document | Path |
| --- | --- |
| | |

## Related Contracts

| Contract | Path |
| --- | --- |
| | |