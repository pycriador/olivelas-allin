---
id: "DOC-CTR-WPP"
title: "WhatsApp Order Payload Contract"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Contract"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# WhatsApp Order Payload Contract

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/contracts/whatsapp-message-contract.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## WhatsApp Order Payload Contract

When a customer triggers "Finish Order on WhatsApp" or "Order via WhatsApp", the app constructs a structured markdown text message and URL-encodes it.

## Endpoint

```text
https://wa.me/{WHATSAPP_PHONE_NUMBER}?text={URL_ENCODED_MESSAGE}
```

## Full Order Format (Cart Drawer)

```text
*🌿 NOVO PEDIDO - HORTIFRUTI NATURAL*
----------------------------------------
*Cliente:* Maria Silva
*Telefone:* (11) 98765-4321
*Entrega:* Rua das Flores, 123 - Centro

*ITENS DO PEDIDO:*
• 2x Banana Prata Orgânica (1 kg) - R$ 12,98
• 1x Melancia Fresca Fatiada - R$ 14,90 (Sob Encomenda)
• 3x Alface Crespa Hidropônica - R$ 10,50

----------------------------------------
*Subtotal:* R$ 38,38
*Taxa de Entrega:* R$ 5,00
*TOTAL DO PEDIDO:* R$ 43,38
----------------------------------------
*Observações:* Entregar no período da manhã.
```

## Direct Single-Item Order Format (Product Modal)

```text
*🌿 ENCOMENDA DIRETA - HORTIFRUTI NATURAL*
Olá! Gostaria de encomendar o seguinte item fresco:
• *Produto:* Melancia Fresca Fatiada (HF007)
• *Quantidade:* 2 unidade
• *Preço estimado:* R$ 29,80

Por favor, confirme a disponibilidade e o prazo de entrega. Obrigado!
```

See [../application/cart-and-checkout.md](../application/cart-and-checkout.md) for checkout flow details.
