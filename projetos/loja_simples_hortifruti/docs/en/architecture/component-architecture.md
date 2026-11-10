---
id: "DOC-ARCH-COMP"
title: "Component Architecture & Modules"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Architecture"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Component Architecture & Modules

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/architecture/component-architecture.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Component Architecture & Modules

The application codebase is structured as modular, independent ES6 modules:

```text
assets/js/
├── app.js            # Main bootstrap orchestrator for the storefront
├── catalog.js        # Catalog rendering and stock status badge computations
├── cart.js           # Shopping cart state, totals calculation, checkout dispatch
├── modal.js          # Product detail modal, variation logic, URL deep linking
├── search.js         # Instant debounced multi-field search engine
├── filters.js        # Category filtering and sorting controls
├── pagination.js     # Dynamic pagination controls and math
├── whatsapp.js       # Structured message formatter for WhatsApp API
└── utils.js          # Currency formatting (BRL R$), debounce, and DOM helpers
```

## Module Responsibilities

### 1. `app.js` (Application Bootstrap)
- Loads and merges base catalog data from [data/produtos.json](../../../data/produtos.json) with `localStorage`.
- Bootstraps search, filter, pagination, cart, and modal modules.
- Holds central product collection in memory.

### 2. `catalog.js` (Storefront Showcase)
- Tracks active filters (`activeCategory`, `searchTerm`, `sortOrder`, `currentPage`).
- Renders responsive product cards with dynamic inventory badges ("Made to Order", "Last Unit", "Low Stock", "Out of Stock", "Featured").
- Dispatches open-modal events upon card clicks.

### 3. `modal.js` (Modals & Deep Linking)
- Renders detailed product view on click or direct URL entry (`?p=HF007`).
- Updates browser address bar using `history.pushState` and handles `popstate`.
- Manages variation options and sticky action footer.

### 4. `cart.js` (Cart & Checkout)
- Persists shopping cart state in `localStorage` (`hortifruti_carrinho`).
- Calculates dynamic subtotal, delivery fee, and grand total.
- Validates delivery form and routes message generation to [assets/js/whatsapp.js](../../../assets/js/whatsapp.js).

See [state-management.md](state-management.md) for reactive state flow.
