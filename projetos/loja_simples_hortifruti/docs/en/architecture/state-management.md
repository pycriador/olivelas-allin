---
id: "DOC-ARCH-STATE"
title: "Client-Side Reactive State Management"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Architecture"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Client-Side Reactive State Management

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/architecture/state-management.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Client-Side Reactive State Management

The application state model blends versioned base data with runtime browser mutations.

```text
[produtos.json (Base SoT)]
         │
         ▼
[fetch('/data/produtos.json')] ──▶ [Merge with localStorage('hortifruti_produtos')]
                                                │
                                                ▼
                                     [In-Memory Global State]
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
         [Storefront Catalog]          [Product Details Modal]       [Shopping Cart Drawer]
         - Search & Category Filter    - Variation Selector          - Quantity Spinners
         - Live Stock Badges           - URL Routing Sync            - Shipping & Subtotal
```

## Stock Status Resolution Rules

The stock resolution logic across storefront modules executes the following priority sequence:
1. If `sob_encomenda === true` or `status_disponibilidade === 'sob_encomenda'`: displays **Made to Order** badge and WhatsApp order button.
2. If `estoque_atual === 0` or `esgotado === true`: displays **Out of Stock** badge and disables add-to-cart.
3. If `estoque_atual === 1`: displays **Last Unit** alert badge.
4. If `estoque_atual > 1` and `estoque_atual <= 5`: displays **Low Stock** warning badge.
5. If `estoque_atual > 5`: displays standard in-stock status.

For storage keys and schemas, see [../contracts/localstorage-schema.md](../contracts/localstorage-schema.md).
