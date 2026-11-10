---
name: document-after-change
description: >-
  After any relevant code, infrastructure, or contract change, keep project
  documentation in sync: update existing Markdown, append changelog entries for
  features and resources, review predefined standards/specs, and publish to
  Confluence when a docs-sync pipeline is available. Use whenever the agent
  modifies application code, APIs, ops/runbooks, architecture, security, or
  docs; when the user asks to document changes, update changelog, sync docs,
  or publish to Confluence.
---

# Document After Change

A technical change is **incomplete** until required documentation is updated (or explicit documentation debt is recorded).

Apply this skill in the **same turn** as substantive code/infra/contract edits—do not defer documentation to a later prompt unless the user explicitly asks to skip docs.

## When documentation is required

| Change | Update docs? |
| --- | --- |
| New component / responsibility shift | Yes |
| API, event, message, file, or command contract | Yes |
| Behavior visible to users or integrators | Yes |
| Architecture / trust boundary | Yes |
| Infrastructure (env, networking, scaling, deploy) | Yes |
| Security (auth, secrets, encryption, privileges) | Yes |
| Operational (runbook, escalation, recovery, alerts, SLOs) | Yes |
| New feature or resource consumers must discover | Yes + changelog |
| Internal fix/refactor with no external or ops impact | Evaluate—skip only if no doc claim became false |
| Typo / whitespace-only | Docs-only polish; no changelog noise |

## Workflow (mandatory order)

Copy and track:

```text
Docs sync progress:
- [ ] 1. Impact analysis
- [ ] 2. Review standards & specs
- [ ] 3. Update existing Markdown (prefer edit over create)
- [ ] 4. Changelog entry (when warranted)
- [ ] 5. Consistency pass (links, metadata, bilingual if required)
- [ ] 6. Confluence publish (only if available and safe)
- [ ] 7. Report what was documented
```

### 1. Impact analysis

From the diff and repo layout, list:

- Which **existing** docs become stale (README, `docs/**`, ADRs, runbooks, API/contract docs, architecture overviews).
- Whether the change is **breaking**, **operational**, or **security-sensitive**.
- Whether a new doc is truly needed (only if no canonical doc covers the topic).

Prefer updating the **canonical** page over duplicating content.

### 2. Review predefined standards and specifications

Before writing, locate and follow repo-local rules (first match wins per topic):

1. Cursor project rules: `.cursor/rules/` (`docs-first`, `docs-clear-language`, `docs-knowledge-in-markdown`, `docs-reuse-patterns`, `docs-area-map`, `docs-quality-checks`)
2. Project docs standards: `docs/**/standards.md`, `docs/**/change-policy.md`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING*`
3. Templates under `docs/**/templates/`
4. Validation gates: `docs:validate`, `scripts/docs_lint.py`, `docs/validation-config.yaml`, Makefile `docs-*` targets
5. Loft / org plugins and skills when present (language, security, API, deploy)

**Hard rules while documenting:**

- Do **not** invent components, SLOs, owners, or controls absent from code or confirmed sources—mark Unknown / open debt instead.
- Never write secrets, tokens, or PII into docs; use placeholders only.
- Do **not** unilaterally set governed docs to `ACCEPTED` if the repo uses lifecycle statuses—use `DRAFT` / `REVIEW` per local policy when editing authoritative content.
- Respect language policy: code/comments/commit messages in English; Confluence consumer docs in Brazilian Portuguese; in-repo Markdown follows **repo convention** (bilingual trees keep both sides in sync when the repo requires it).

### 3. Update existing Markdown

1. Search for docs that mention the changed module, route, contract, or procedure.
2. Edit those files in place: correct as-is descriptions, diagrams, inventories, and related-docs links.
3. Refresh document metadata when the project uses it (`updated`, `version`, `status`, `owner`).
4. Create a **new** Markdown file only when the topic has no home; then link it from the nearest index/README/manifest.
5. If docs cannot ship with the change, record **documentation debt** (why, owner, priority, target) instead of silent lag.

### 4. Changelog

When the change alters contracts, architecture, ops, security guidance, deprecations, or introduces discoverable features/resources, append a changelog entry.

Canonical location (first that exists):

1. `CHANGELOG.md` (repo root)
2. `docs/**/changelog.md` (language-specific if bilingual)
3. Documentation section in project README / release notes

Do **not** maintain multiple divergent changelogs. Skip noise (typos, link-only fixes, pure rewording).

Entry shape and examples: [references/changelog.md](references/changelog.md).

List **all** new or changed consumer-facing resources in the entry (APIs, flags, env vars, dashboards, runbooks, CLI commands, pages).

### 5. Consistency pass

- Relative links resolve; related-docs sections updated.
- Inventories/tables match code (routes, configs, components).
- Bilingual repos: apply the same semantic change to EN and pt-BR when both trees exist.
- Run available validators (`make docs-validate`, `docs-lint`, etc.) when present; fix failures you introduced.

### 6. Confluence publish (conditional)

Publish **only when** a one-way Markdown → Confluence path exists and credentials/config are usable.

Detection and commands: [references/confluence-publish.md](references/confluence-publish.md).

Rules:

- Git / local Markdown remains source of truth; Confluence is a published view.
- Prefer `validate` → `plan`/`status` → `sync --dry-run` before a real `sync`.
- Never commit `.env` or log Confluence tokens.
- If Confluence tooling or credentials are missing, **skip publish** and state that clearly—still complete local Markdown + changelog.
- Do not run destructive Confluence commands (`flush`, `cleanup`) unless the user explicitly requests them.

### 7. Report back

End the documentation work with a short summary for the user:

- Docs updated (paths)
- Changelog entry added? (yes/no + path)
- Standards checked (which files)
- Confluence: published / dry-run only / skipped (reason)

## Anti-patterns

- Shipping code changes without touching stale docs that now lie
- Creating parallel “AI summary” docs instead of updating canonical pages
- Changelog spam for formatting-only edits
- Treating Proposed / Inferred content as current production truth
- Publishing to Confluence without validate when the project provides it
- Blocking the user’s code change solely because Confluence is unavailable
