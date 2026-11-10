# Changelog entry format

## Fields

| Field | Guidance |
| --- | --- |
| Date | `YYYY-MM-DD` (use the change date) |
| Summary | One or two sentences on **why** it matters |
| Resources | Bullet list of every new/changed consumer-facing resource |
| Impact | Who should re-read (operators, integrators, all) |
| Links | Paths to updated docs and/or PR |

## Template

```markdown
## YYYY-MM-DD

- Summary: <why this change matters>
- Resources:
  - <API / route / event / flag / env var / runbook / dashboard / CLI>
  - <…>
- Impact: <operators | integrators | all>
- See: <path/to/doc.md>, <optional PR link>
```

## Example

```markdown
## 2026-08-11

- Summary: Added portfolio public Slack webhook and documented auth boundary for `/api/webhooks/slack`.
- Resources:
  - `POST /api/webhooks/slack`
  - Env: `SLACK_SIGNING_SECRET` (placeholder only in docs)
  - Runbook: `docs/pt-BR/operations/slack-webhooks.md`
- Impact: operators, integrators
- See: docs/pt-BR/aiops-apps/routes.md, docs/en/aiops-apps/routes.md
```

## When to skip

- Typos, formatting, whitespace
- Link repairs with no semantic change
- Translation sync without semantic delta
- Pure internal refactors that left no doc claim false

Git history remains the source of truth for those edits.
