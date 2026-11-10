# Confluence publish (when available)

## Detect availability

Treat Confluence publish as available when **any** of these exist in the repo:

| Signal | Typical location |
| --- | --- |
| `docs-sync` Python CLI | `docs-sync/` |
| Sync configs | `docs-sync/config*.yaml`, `docs-sync/**/*.yaml` |
| Make targets | `docs-sync-pt-br`, `docs-sync-*` |
| Env template | `docs-sync/.env.example` or root `.env.example` with `CONFLUENCE_*` |

If none exist, skip publish and say Confluence sync is not configured for this project.

## Credentials

Required env vars (names may vary; never commit values):

- `CONFLUENCE_URL`
- `CONFLUENCE_SPACE`
- `CONFLUENCE_USERNAME`
- `CONFLUENCE_API_TOKEN`
- Optional: `CONFLUENCE_ROOT_PAGE_ID`

Load from gitignored `.env` only. If vars are missing, skip real sync; optionally run offline `validate` / `--fake` / `--dry-run` when useful.

## Recommended sequence (docs-sync style)

```bash
# 1) Validate Markdown tree
cd docs-sync && uv run docs-sync validate --config config.pt-BR.yaml
# or: make docs-sync-validate / make docs-sync-pt-br targets when present

# 2) See what would change
uv run docs-sync status --config config.pt-BR.yaml
uv run docs-sync plan --config config.pt-BR.yaml --changes-only
# or: make docs-sync-pt-br-plan

# 3) Dry-run before write
uv run docs-sync sync --config config.pt-BR.yaml --dry-run
# or: make docs-sync-pt-br-dry

# 4) Real publish — only with user intent or explicit project habit to sync after docs changes
uv run docs-sync sync --config config.pt-BR.yaml
# or: make docs-sync-pt-br
```

Choose the config that matches the docs tree you edited (e.g. `config.pt-BR.yaml`, pack-specific YAML under `docs-sync/aiops-config/`).

For the **AIOps 3-level hub**, read [`docs-sync/aiops-config/hub-registry.yaml`](../../../docs-sync/aiops-config/hub-registry.yaml) and use Make targets `docs-sync-aiops-team-plan`, `docs-sync-aiops-team`, `docs-sync-aiops-app-plan APP=….md`, or skill [sync-aiops-hub](../../sync-aiops-hub/SKILL.md). Put shell comments on their own line, not after `make`.

## Safety

- One-way: Markdown → Confluence. Do not treat Confluence as editable source of truth.
- Dual-surface links required: Confluence page links (`--relink`) and GitHub source/code links (`repository_url` footer + blob citations). Policy: `docs/en/publishing-surfaces.md` / `docs/pt-BR/publishing-surfaces.md`.
- Do not run `flush` or `cleanup` unless the user explicitly asks.
- Prefer publishing only the changed subtree (`--docs`, `--include`) when the CLI supports it.
- Never print API tokens in chat, logs, or commit messages.

## If publish fails

1. Leave local Markdown + changelog correct (they remain SoT).
2. Report the error without secrets.
3. Suggest validate/plan fixes; do not invent Confluence page IDs.
