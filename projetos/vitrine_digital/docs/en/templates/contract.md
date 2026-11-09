---
title: "Contract Name"
status: "DRAFT"
owner: "team-or-role"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
review_date: "YYYY-MM-DD"
version: "1.0"
contract_type: "API"
---

# Contract Name

> Language: EN | [Português (pt-BR)](../../pt-BR/templates/contract.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

Mark sections **Not Applicable** when they do not apply. Do not invent endpoints, fields, error codes, or guarantees without evidence. Classify claims as Confirmed / Inferred / Unknown / Proposed.

## Purpose

<!-- Why this contract exists and what capability it exposes. -->

## Scope

| In scope | Out of scope |
| --- | --- |
| | |

## Participants

| Participant | Role | Notes | Classification |
| --- | --- | --- | --- |
| | producer / consumer / intermediary / other | | Confirmed / Inferred / Unknown |

## Producer

| Field | Value | Classification |
| --- | --- | --- |
| System / component | | Confirmed / Inferred / Unknown |
| Team / owner | | |
| Evidence | | |

## Consumer

| Consumer | Notes | Classification |
| --- | --- | --- |
| | | Confirmed / Inferred / Unknown |

## Contract Type

- [ ] API
- [ ] Event
- [ ] Message
- [ ] File
- [ ] Command
- [ ] Callback
- [ ] Library
- [ ] Data
- [ ] Integration
- [ ] Other: <!-- specify -->

## Protocol

| Field | Value | Classification |
| --- | --- | --- |
| Protocol | | Confirmed / Inferred / Unknown / Not Applicable |
| Interaction style | request-response / fire-and-forget / stream / batch / other | |

## Endpoint / Channel / Interface

| Field | Value | Classification |
| --- | --- | --- |
| Locator | | Confirmed / Inferred / Unknown / Not Applicable |
| Method / operation / verb | | Confirmed / Inferred / Unknown / Not Applicable |
| Notes | | |

## Request / Input

| Field / part | Type | Required | Description | Classification |
| --- | --- | --- | --- | --- |
| | | yes / no | | Confirmed / Inferred / Unknown |

## Response / Output

| Field / part | Type | Required | Description | Classification |
| --- | --- | --- | --- | --- |
| | | yes / no | | Confirmed / Inferred / Unknown |

## Schema

```text
<!-- schema or path to schema -->
```

| Topic | Value | Classification |
| --- | --- | --- |
| Schema location | | Confirmed / Inferred / Unknown / Not Applicable |
| Schema format | | |

## Semantics

| Concept | Meaning | Side effects | Classification |
| --- | --- | --- | --- |
| | | | Confirmed / Inferred / Unknown |

## Authentication

| Mechanism | Notes | Classification |
| --- | --- | --- |
| | | Confirmed / Inferred / Unknown / Not Applicable |

<!-- No secret values. Document secret references only. -->

## Authorization

| Rule | Notes | Classification |
| --- | --- | --- |
| | | Confirmed / Inferred / Unknown / Not Applicable |

## Validation

| Rule | Applied where | Notes | Classification |
| --- | --- | --- | --- |
| | producer / consumer / gateway / other | | Confirmed / Inferred / Unknown / Not Applicable |

## Errors

| Error / Condition | Retryable | Consumer Action | Classification |
| --- | --- | --- | --- |
| | yes / no / Unknown | | Confirmed / Inferred / Unknown / Not Applicable |

## Retry Behavior

| Topic | Value | Classification |
| --- | --- | --- |
| Retryable conditions | | Confirmed / Inferred / Unknown / Not Applicable |
| Max attempts | | |
| Backoff | | |
| Non-retryable conditions | | |

## Timeout

| Timeout | Value | Classification |
| --- | --- | --- |
| Client / consumer timeout | | Confirmed / Inferred / Unknown / Not Applicable |
| Server / producer timeout | | |
| Other | | |

## Idempotency

| Topic | Value | Classification |
| --- | --- | --- |
| Idempotent | yes / no / Unknown / Not Applicable | |
| Idempotency key / strategy | | Confirmed / Inferred / Unknown / Not Applicable |

## Ordering

| Topic | Value | Classification |
| --- | --- | --- |
| Ordering guarantee | none / per-key / global / Unknown / Not Applicable | Confirmed / Inferred / Unknown / Not Applicable |
| Notes | | |

## Delivery Semantics

| Topic | Value | Classification |
| --- | --- | --- |
| Delivery guarantee | at-most-once / at-least-once / exactly-once / Unknown / Not Applicable | Confirmed / Inferred / Unknown / Not Applicable |
| Acknowledgement model | | |
| Notes | | |

## Versioning

| Topic | Value | Classification |
| --- | --- | --- |
| Current version | | Confirmed / Inferred / Unknown |
| Version strategy | | |
| Deprecation policy | | |
| Contract ID | | |

## Compatibility

| Change type | Compatible? | Notes |
| --- | --- | --- |
| Additive optional field | | |
| Field removal | | |
| Type change | | |
| Semantic change | | |
| Other | | |

## Rate Limits

| Limit | Value | Classification |
| --- | --- | --- |
| | | Confirmed / Inferred / Unknown / Not Applicable |

## Size Limits

| Limit | Value | Classification |
| --- | --- | --- |
| Payload / message / file size | | Confirmed / Inferred / Unknown / Not Applicable |

## Security Considerations

| Topic | Summary | Classification |
| --- | --- | --- |
| Data sensitivity | | Confirmed / Inferred / Unknown / Not Applicable |
| Encryption in transit | | |
| PII / secrets handling | | |

## Observability

| Signal | What to observe | Classification |
| --- | --- | --- |
| Logs | | Confirmed / Inferred / Unknown / Not Applicable |
| Metrics | | |
| Traces | | |

## Examples

### Example — success

```text
<!-- representative example without secrets or sensitive data -->
```

### Example — error

```text
<!-- representative example -->
```

## Failure Scenarios

| Scenario | Impact | Expected behavior | Mitigation | Classification |
| --- | --- | --- | --- | --- |
| | | | | Confirmed / Inferred / Unknown / Not Applicable |

## Related Components

| Component | Relationship | Path / ID |
| --- | --- | --- |
| | producer / consumer / depends-on | |

## Related Architecture

| Document | Path |
| --- | --- |
| Architecture | |
| System context | |
| Data flow / sequence | |