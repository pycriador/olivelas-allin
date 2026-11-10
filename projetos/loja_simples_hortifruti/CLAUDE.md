# AGENTS.md

Context and guidelines for AI Coding Agents working on **Hortifruti Natural** (Loja de Produtos).

## Application Overview

- **Stack**: Pure HTML5, Modern CSS3 (CSS Variables), Vanilla ES6 Modules (No Node.js build runtime).
- **Storefront Entry**: `index.html` with modules in `assets/js/` and styles in `assets/css/`.
- **Admin Dashboard**: `admin/index.html` with `admin/admin.js` and `admin/admin.css`.
- **Catalog Baseline**: `data/produtos.json`.
- **Documentation**: Markdown in `docs/en/` and `docs/pt-BR/`, validated via `scripts/docs_lint.py`.

## Key Commands

- **Local Dev Server**: `python -m http.server 8000`
- **Validate Docs**: `python scripts/docs_lint.py validate`
- **Check Docs Links**: `python scripts/docs_lint.py check-links`
- **Check Docs Manifest**: `python scripts/docs_lint.py check-manifest`

## Boundaries & Principles

- **Zero-Backend**: Do not introduce server dependencies or heavy runtime frameworks.
- **Stock Resolution**: Always compute stock states through real-time checks (`sob_encomenda`, `esgotado`, `poucas_unidades`, `ultima_unidade`).
- **Deep Linking**: The storefront uses `?p=PRODUCT_ID` for direct product access without page reloads.
- **Sticky Modals**: Product action buttons ("Add to Cart" / "Order on WhatsApp") must stay persistently visible at the modal footer.
- **Bilingual Docs Parity**: Any documentation update must be mirrored across `docs/en/` and `docs/pt-BR/` with zero lint errors.
