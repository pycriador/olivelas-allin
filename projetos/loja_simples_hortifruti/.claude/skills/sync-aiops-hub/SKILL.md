---
name: sync-aiops-hub
description: >-
  On-demand update and Confluence publish for the AIOps 3-level documentation
  hub (team / application / repository). Reads hub-registry.yaml, edits Markdown
  in aiops-documentation for levels 1–2, opens PRs in app repos for level 3 READMEs,
  and runs scoped docs-sync. Use when the user asks to update the AIOps team hub,
  sync an app page to Confluence, refresh level-3 README links, or run the AIOps
  documentation model workflow.
---

# Sync AIOps Hub (3 levels)

On-demand workflow for the AIOps documentation model. **Markdown in this repo is SoT** for levels 1–2; **app repo README is SoT** for level 3.

## Before starting

1. Read [`docs-sync/aiops-config/hub-registry.yaml`](../../docs-sync/aiops-config/hub-registry.yaml).
2. Read model: [`docs/en/aiops-team/documentation-model.md`](../../docs/en/aiops-team/documentation-model.md) (mirror pt-BR).
3. Load Confluence credentials from gitignored `.env` only — never commit tokens.

## Level selection

| User intent | Level | Action |
| --- | --- | --- |
| Team charter, responsibilities, catalog | 1 | Edit `docs/{en,pt-BR}/aiops-team/` |
| Single product overview | 2 | Edit `docs/{en,pt-BR}/aiops-apps/{app}.md` |
| Run instructions, API detail in repo | 3 | PR in `loft-br/{app-repo}`; update blob links in level 2 |

Keep EN and pt-BR semantically in sync.

## Level 1–2 workflow

```text
1. Edit Markdown with code/repo evidence
2. Classify claims: Confirmed / Inferred / Unknown — never invent owners or SLOs
3. make docs-validate  (must pass with zero ERROR)
4. Scoped docs-sync validate → plan --changes-only
5. Show plan to user; sync only with explicit publish intent
6. Append docs/pt-BR/changelog.md when change is user-visible
```

### Commands

**Team hub (level 1):**

```bash
make docs-sync-aiops-team-plan
# Publish only after reviewing the plan:
make docs-sync-aiops-team
```

**Application page (level 2):**

```bash
make docs-sync-aiops-app-plan APP=dataforge.md
make docs-sync-aiops-app APP=dataforge.md
```

Do not append `# comments` on the same line as `make` — some runners pass `#` as a make target.

Or CLI with `--only`:

```bash
cd docs-sync && set -a && source ../.env && set +a
uv run docs-sync sync --config aiops-config/documentacao-inicial.pt-BR.yaml \
  --docs ../../docs/pt-BR/aiops-team --changes-only --relink
uv run docs-sync sync --config aiops-config/aiops-apps.pt-BR.yaml \
  --only REF-AIOPS-APPS-008 --changes-only --relink
```

## Level 3 workflow

1. Read app repo (`hub-registry.yaml` → `repository.apps[]`).
2. Compare root `README.md` against contract sections in registry.
3. If gaps exist: branch + PR in **app repo** (English code/comments; Portuguese UI copy).
4. Update level-2 page blob links in **this** repo.
5. Record audit in `examples/level3-readme-pilots/{app}.md` when doing pilot checks.
6. Run scoped level-2 sync if links changed.

**Never** commit secrets or `.env` values. Use placeholders only.

## Publishing rules

- One-way: Markdown → Confluence ([publishing-surfaces.md](../../docs/en/publishing-surfaces.md)).
- Always `--relink` on real publishes.
- Do not run `flush` or `cleanup` unless the user explicitly asks.
- If Confluence credentials missing: stop after `validate` / `--fake` plan; leave Markdown correct.

## Related

- Registry: [`docs-sync/aiops-config/hub-registry.yaml`](../../docs-sync/aiops-config/hub-registry.yaml)
- Confluence profiles: [`docs-sync/aiops-config/README.md`](../../docs-sync/aiops-config/README.md)
- Post-change skill: [document-after-change](../document-after-change/SKILL.md)
- Confluence sequence: [document-after-change/references/confluence-publish.md](../document-after-change/references/confluence-publish.md)
