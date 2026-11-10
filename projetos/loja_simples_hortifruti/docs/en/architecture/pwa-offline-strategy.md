---
id: "DOC-ARCH-PWA"
title: "PWA & Offline Strategy"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Architecture"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# PWA & Offline Strategy

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/architecture/pwa-offline-strategy.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## PWA & Offline Strategy

The application implements modern Progressive Web App (PWA) standards enabling home-screen installation and offline catalog viewing.

## Core PWA Assets

1. **Service Worker ([sw.js](../../../sw.js))**:
   - Caching strategy: **Cache First** for static assets (HTML, CSS, JS, icons) and **Stale-While-Revalidate** for `produtos.json`.
   - Automatic cache version invalidation (`CACHE_NAME = 'hortifruti-v1.x'`).
2. **Web App Manifest ([manifest.webmanifest](../../../manifest.webmanifest))**:
   - Configures theme colors (`#2d7a3a`), high-resolution icons, and `standalone` display mode.
3. **Offline Fallback ([offline.html](../../../offline.html))**:
   - Dedicated fallback view displayed when accessing uncached routes with no active internet connection.

See [../operations/deployment.md](../operations/deployment.md) for deployment and caching details.
