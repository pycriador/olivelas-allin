---
id: "DOC-APP-MODALS"
title: "Product Modals & Deep Linking"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Application"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Product Modals & Deep Linking

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/application/product-modals.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Product Modals & Deep Linking

The product modal module ([assets/js/modal.js](../../../assets/js/modal.js)) handles rich item inspection and unique product deep linking.

## Key Features

1. **Unique URL Deep Linking (`?p=ID`)**:
   - Every product has a shareable permalink (e.g. `https://yoursite.com/?p=HF007`).
   - Opening a modal updates browser address bar using `history.pushState` without page reloads.
   - Closing the modal (close button, Escape key, backdrop click) purges the query parameter.
   - Full browser Back/Forward history navigation support (`window.onpopstate`).
2. **Sticky Action Footer**:
   - "Add to Cart" and "Order via WhatsApp" action buttons stay anchored at the modal bottom, ensuring friction-free access on mobile viewports.
3. **Smart Variation Rendering**:
   - Variation option containers are conditionally rendered only when variations exist. Single-option items never show empty boxes.

See [storefront-catalog.md](storefront-catalog.md) for catalog showcase interaction details.
