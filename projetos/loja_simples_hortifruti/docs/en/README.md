---
id: "DOC-ROOT-README"
title: "Documentation Overview"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Overview"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Documentation Overview

> Idioma: English (EN) | [Português (pt-BR)](../pt-BR/README.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


Welcome to the official documentation for the **Hortifruti Natural - Product Store** project. This repository contains a modern e-commerce web application for fresh produce, featuring a dynamic catalog, smart shopping cart, direct WhatsApp order checkout, and a full-featured admin dashboard for catalog and inventory management.

## Documentation Structure

The documentation is organized modularly in both English (`en`) and Portuguese (`pt-BR`), covering every engineering aspect of the application:

| Area | Description | Key Documents |
| --- | --- | --- |
| **Overview & AI** | Starting point and context for AI coding assistants | [ai-context.md](ai-context.md) |
| **Architecture** | System design, client-side reactivity, and PWA strategy | [architecture/architecture-overview.md](architecture/architecture-overview.md), [architecture/component-architecture.md](architecture/component-architecture.md), [architecture/state-management.md](architecture/state-management.md), [architecture/pwa-offline-strategy.md](architecture/pwa-offline-strategy.md) |
| **Application** | Deep dive into storefront, admin, cart, and modals | [application/storefront-catalog.md](application/storefront-catalog.md), [application/admin-panel.md](application/admin-panel.md), [application/cart-and-checkout.md](application/cart-and-checkout.md), [application/product-modals.md](application/product-modals.md) |
| **Contracts** | Data schemas, persistence keys, and WhatsApp payload | [contracts/produtos-json-schema.md](contracts/produtos-json-schema.md), [contracts/localstorage-schema.md](contracts/localstorage-schema.md), [contracts/whatsapp-message-contract.md](contracts/whatsapp-message-contract.md) |
| **Operations** | Local dev setup, static deployment, and maintenance | [operations/local-development.md](operations/local-development.md), [operations/deployment.md](operations/deployment.md), [operations/catalog-maintenance.md](operations/catalog-maintenance.md) |
| **Security & Privacy** | Static app security boundaries and data protection | [security/client-security-model.md](security/client-security-model.md), [security/privacy-and-data-handling.md](security/privacy-and-data-handling.md) |

## Core Engineering Principles

1. **Zero Backend Runtime**: 100% static client-side architecture deployable to any simple static host or CDN.
2. **High Performance & Zero Bloat**: Vanilla ES6+ Modules with no heavy runtime dependencies or build-step overhead.
3. **Smart Hybrid Persistence**: Version-controlled base JSON (`data/produtos.json`) combined with reactive browser `localStorage` overrides.
4. **Mobile-First Experience**: Fully responsive touch UI, PWA offline caching, and frictionless WhatsApp checkout.
