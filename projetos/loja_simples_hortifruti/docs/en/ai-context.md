---
id: "DOC-AI-CTX"
title: "AI Context & Assistant Guide"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Guide"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# AI Context & Assistant Guide

> Idioma: English (EN) | [Português (pt-BR)](../pt-BR/ai-context.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Application Context

**Hortifruti Natural** is a modern e-commerce web application for fresh produce (fruits, greens, vegetables, organics, herbs). It runs entirely on the client side with zero server runtime, utilizing `localStorage` for local state persistence and integrating directly with WhatsApp for order completion.

## Key File Locations

- **Storefront**: [index.html](../../index.html) and modules in `assets/js/` ([app.js](../../assets/js/app.js), [catalog.js](../../assets/js/catalog.js), [cart.js](../../assets/js/cart.js), [modal.js](../../assets/js/modal.js), [filters.js](../../assets/js/filters.js), [search.js](../../assets/js/search.js), [whatsapp.js](../../assets/js/whatsapp.js), [utils.js](../../assets/js/utils.js)).
- **Admin Dashboard**: [admin/index.html](../../admin/index.html), [admin/admin.js](../../admin/admin.js), and [admin/admin.css](../../admin/admin.css).
- **Base Product Catalog**: [data/produtos.json](../../data/produtos.json).
- **Stylesheets**: [assets/css/style.css](../../assets/css/style.css), [assets/css/components.css](../../assets/css/components.css), [assets/css/layout.css](../../assets/css/layout.css), [assets/css/responsive.css](../../assets/css/responsive.css), [assets/css/variables.css](../../assets/css/variables.css).
- **PWA & Service Worker**: [sw.js](../../sw.js) and [manifest.webmanifest](../../manifest.webmanifest).

## AI Assistant Implementation Guidelines

1. **Preserve Native ES6+ Standards**: Do not introduce unnecessary heavy runtimes or build steps. Keep pure native ES Modules.
2. **Stock Resolution Logic**: Dynamic stock rules in [catalog.js](../../assets/js/catalog.js) and [modal.js](../../assets/js/modal.js) compute badges (`sob_encomenda`, `esgotado`, `poucas_unidades`, `ultima_unidade`).
3. **Single Product URL Routing**: The storefront supports deep linking via URL query parameter `?p=<PRODUCT_ID>`. Opening a modal triggers `history.pushState`; closing removes the parameter.
4. **Sticky Modal Action Footers**: The product modal actions ("Add to Cart" and "Order via WhatsApp") must remain persistently visible via sticky positioning.
5. **Variation Container Visibility**: If a product has no variations, do not render empty selector containers.
6. **Documentation Parity**: All documentation changes must maintain bilingual parity between `docs/en/` and `docs/pt-BR/` and pass `python scripts/docs_lint.py validate`.
