---
id: "DOC-ARCH-OVR"
title: "System Architecture Overview"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Architecture"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# System Architecture Overview

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/architecture/architecture-overview.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## System Architecture Overview

The **Hortifruti Natural** system adopts a decoupled static client-side architecture (Zero-Backend Single Page Application) engineered for ultra-fast load times, low hosting complexity, and high reliability.

```text
+-------------------------------------------------------------------------+
|                                BROWSER                                  |
|                                                                         |
|  +------------------------+             +----------------------------+  |
|  | Storefront (index.html)|             |   Admin (admin/index.html) |  |
|  |  +------------------+  |             |  +-----------------------+ |  |
|  |  | Catalog Module   |  |             |  | Admin Manager Module  | |  |
|  |  | Cart Module      |  |             |  | Product CRUD & Stock  | |  |
|  |  | Modal & Routing  |  |             |  | JSON Backup / Restore | |  |
|  |  +--------+---------+  |             |  +-----------+-----------+ |  |
|  +-----------|------------+             +--------------|-------------+  |
|              |                                         |                |
|              +--------------------+--------------------+                |
|                                   |                                     |
|                         +---------v----------+                          |
|                         |  State Management  |                          |
|                         |  (Hybrid Storage)  |                          |
|                         +----+------------+--+                          |
|                              |            |                             |
|                              v            v                             |
|                      [LocalStorage]  [produtos.json]                    |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Service Worker (sw.js) - Cache First Assets / Stale While Reval   |  |
|  +-------------------------------------------------------------------+  |
+-----------------------------------|-------------------------------------+
                                    |
                    +---------------v---------------+
                    | WhatsApp API (wa.me Checkout) |
                    +-------------------------------+
```

## Architectural Components

1. **Storefront Frontend ([index.html](../../../index.html))**: Consumer interface with instant multi-field search, category pill filters, deep linking, interactive product modals, and a slide-out cart.
2. **Admin Dashboard ([admin/index.html](../../../admin/index.html))**: Isolated management interface for adding, editing, deleting products, adjusting stock in real time, and importing/exporting JSON.
3. **Hybrid Data Layer ([assets/js/app.js](../../../assets/js/app.js))**: Engine that loads the canonical [data/produtos.json](../../../data/produtos.json) and merges live overrides from `localStorage`.
4. **Checkout Engine ([assets/js/cart.js](../../../assets/js/cart.js))**: Formatter generating structured WhatsApp order payloads with item totals, delivery fees, and customer addresses.
5. **Offline Layer ([sw.js](../../../sw.js))**: Service Worker providing asset caching and offline availability.

For details regarding internal module organization, see [component-architecture.md](component-architecture.md).
