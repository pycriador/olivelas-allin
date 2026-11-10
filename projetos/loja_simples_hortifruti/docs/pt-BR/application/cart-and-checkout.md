---
id: "DOC-APP-CART"
title: "Carrinho de Compras e Checkout via WhatsApp"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Application"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Carrinho de Compras e Checkout via WhatsApp

> Idioma: Português (pt-BR) | [English (EN)](../../en/application/cart-and-checkout.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Carrinho de Compras e Checkout via WhatsApp

O módulo de carrinho ([assets/js/cart.js](../../../assets/js/cart.js)) provê uma gaveta lateral deslizante de alta conversão para finalização do pedido.

## Fluxo de Compra

1. **Adição ao Carrinho**:
   - O cliente escolhe a quantidade e variação no card ou no modal de detalhes.
   - O item é adicionado ao carrinho com feedback visual instantâneo (notificação Toast e animação no ícone).
2. **Revisão de Itens**:
   - Ajuste de quantidade (+ / -) com validação de limite de estoque.
   - Remoção de itens com recálculo imediato de totais.
3. **Formulário de Entrega**:
   - Nome do cliente, telefone, endereço, número, bairro e observações de entrega.
   - Opção de escolha entre Entrega em Domicílio ou Retirada na Loja.
4. **Disparo para o WhatsApp**:
   - O botão "Finalizar Pedido pelo WhatsApp" valida os campos obrigatórios.
   - Constrói o texto do pedido formatado em markdown WhatsApp e abre a URL oficial (`https://wa.me/...`).

Consulte [../contracts/whatsapp-message-contract.md](../contracts/whatsapp-message-contract.md) para a estrutura da mensagem gerada.
