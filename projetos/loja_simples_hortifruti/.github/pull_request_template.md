## Summary

<!-- What changed and why -->

## Documentation impact

- [ ] Documentation impact evaluated
- [ ] Relevant documentation updated (or N/A with reason)
- [ ] Root README document index + `docs/*/README.md` updated when docs structure/packs change (or N/A)
- [ ] Manifest updated when adding/removing authoritative docs (or N/A)
- [ ] Relationships / evidence updated when structure or Confirmed claims changed (or N/A)
- [ ] Security impact evaluated
- [ ] Operations impact evaluated

## Automated checks

CI runs Documentation Validation (`scripts/docs_lint.py`). Do not duplicate machine checks here.

Locally:

```bash
make docs-validate
# or: python3 scripts/docs_lint.py validate
```

## Checklist

- [ ] EN and pt-BR updated together (this repository)
- [ ] No secrets or real credentials in docs
- [ ] Status / owner metadata appropriate for changed docs
- [ ] Exceptions recorded if waiving a rule

## Test plan

- [ ] `python3 scripts/docs_lint.py validate` passes locally
