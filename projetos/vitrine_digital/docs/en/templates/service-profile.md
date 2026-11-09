---
title: "Service Profile"
status: "DRAFT"
owner: "team-or-role"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
review_date: "YYYY-MM-DD"
version: "1.0"
service_id: "stable-service-name"
criticality: "High"
---

# Service Profile

> Language: EN | [Português (pt-BR)](../../pt-BR/templates/service-profile.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

Operational identity card for a service or capability. Link architecture components and contracts; do not duplicate component prose or schemas.

## Purpose

<!-- Why this service exists and what user/capability outcome it provides. -->

## Scope

| In scope | Out of scope |
| --- | --- |
| | |

## Ownership

**Required:** each row must have a named owner **or** the token `Unknown`.

| Role | Owner | Notes |
| --- | --- | --- |
| Service / product | <!-- name or Unknown --> | |
| Technical | <!-- name or Unknown --> | |
| Operational / on-call | <!-- name or Unknown --> | |
| Escalation | <!-- name or Unknown --> | |

## Criticality

| Field | Value |
| --- | --- |
| Level | Critical / High / Medium / Low / other / Not Defined |
| Rationale | |
| User / business impact if down | |

## Architecture Links

| Concern | Link |
| --- | --- |
| Architecture overview / component | |
| Failure domains | |
| Dependency map | |

## Dependencies

| Dependency | Type | Criticality | Failure impact | Detection | Mitigation / recovery |
| --- | --- | --- | --- | --- | --- |
| | runtime / build / deploy / operational | | | | |

## Contracts (Reliability-Relevant)

| Contract | Timeout | Retry | Idempotency | Notes |
| --- | --- | --- | --- | --- |
| | | | | |

## Service Levels

| SLI | SLO | Window | Error budget | Classification |
| --- | --- | --- | --- | --- |
| | or N/A / Not Defined | | or N/A | |

## Failure Modes (Summary)

| Failure mode | Impact | Detection | Runbook / recovery |
| --- | --- | --- | --- |
| | | | |

## Observability

| Signal type | Status | Notes / link |
| --- | --- | --- |
| Metrics | Implemented / Partial / N/A / Not Documented | |
| Logs | | |
| Traces | | |
| Health checks | | |
| Alerts | | |

## Operational State

| How state is determined | Healthy / Degraded / Unavailable signals |
| --- | --- |
| | |

## Deploy and Change

| Topic | Link / notes |
| --- | --- |
| Deploy / validate | |
| Rollback stance | Safe / partial / irreversible / Unknown |
| Maintenance | |

## Recovery

| Topic | Status | Link |
| --- | --- | --- |
| Backup / restore | Defined / N/A / Not Defined | |
| RPO / RTO | Defined / Not Defined | |
| Disaster recovery | Defined / Not Defined | |

## Related Runbooks and Incidents

| Artifact | ID / path |
| --- | --- |
| Runbooks | |
| Recent material incidents | |

## Related Documentation

| Document | Path |
| --- | --- |
| Architecture | |
| Contracts | |
| Observability | |