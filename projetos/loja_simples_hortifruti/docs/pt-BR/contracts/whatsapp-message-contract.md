---
id: "DOC-CTR-WPP"
title: "Contrato de Formatação da Mensagem WhatsApp"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Contract"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Contrato de Formatação da Mensagem WhatsApp

> Idioma: Português (pt-BR) | [English (EN)](../../en/contracts/whatsapp-message-contract.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Contrato de Formatação da Mensagem WhatsApp

Quando o cliente clica em "Finalizar Pedido pelo WhatsApp" ou "Encomendar no WhatsApp", a aplicação monta uma mensagem estruturada e a codifica na URL da API do WhatsApp.

## Endpoint

```text
https://wa.me/{NUMERO_WHATSAPP}?text={MENSAGEM_URL_ENCODED}
```

## Formato do Pedido Completo (Carrinho)

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

## Formato de Encomenda Direta (Modal de Produto Sob Encomenda)

```text
*🌿 ENCOMENDA DIRETA - HORTIFRUTI NATURAL*
Olá! Gostaria de encomendar o seguinte item fresco:
• *Produto:* Melancia Fresca Fatiada (HF007)
• *Quantidade:* 2 unidade
• *Preço estimado:* R$ 29,80

Por favor, confirme a disponibilidade e o prazo de entrega. Obrigado!
```

Consulte [../application/cart-and-checkout.md](../application/cart-and-checkout.md) para o fluxo de checkout.
