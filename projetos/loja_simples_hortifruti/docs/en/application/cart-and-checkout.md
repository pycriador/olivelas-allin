---
id: "DOC-APP-CART"
title: "Cart & WhatsApp Order Checkout"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Application"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Cart & WhatsApp Order Checkout

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/application/cart-and-checkout.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Cart & WhatsApp Order Checkout

The shopping cart module ([assets/js/cart.js](../../../assets/js/cart.js)) provides a frictionless sliding drawer designed for fast conversion.

## Checkout Workflow

1. **Add to Cart**:
   - Customer chooses quantity and optional variation from card or modal.
   - Item is added with immediate toast confirmation and badge counter updates.
2. **Item Review**:
   - Increment / decrement quantity with live stock limit validation.
   - Remove items with instant subtotal and grand total recalculation.
3. **Delivery Form**:
   - Customer name, phone, delivery address, neighborhood, and special instructions.
   - Delivery vs. In-Store Pickup selector.
4. **WhatsApp Dispatch**:
   - "Finish Order on WhatsApp" validates required address fields.
   - Encodes formatted WhatsApp markdown text and opens the official API endpoint (`https://wa.me/...`).

See [../contracts/whatsapp-message-contract.md](../contracts/whatsapp-message-contract.md) for message formatting specifics.
