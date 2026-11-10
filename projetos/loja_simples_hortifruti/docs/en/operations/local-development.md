---
id: "DOC-OPS-DEV"
title: "Local Development & Tooling"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Operations"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Local Development & Tooling

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/operations/local-development.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Local Development & Tooling

Because the application is built with pure native ES6 modules, no Node.js/npm dependencies are required for local runtime execution. Any simple static HTTP server can run the project.

## Starting the Local Dev Server

### Option 1: Python 3 (Recommended)
```bash
python -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

### Option 2: Node.js (npx serve)
```bash
npx serve .
```

## Documentation Validation Commands

Documentation links, metadata frontmatters, and manifest integrity are verified via Python standard library tooling:

```bash
# Validate complete documentation suite
python scripts/docs_lint.py validate

# Verify internal markdown links
python scripts/docs_lint.py check-links

# Verify manifest entries
python scripts/docs_lint.py check-manifest
```

See [deployment.md](deployment.md) for production hosting options.
