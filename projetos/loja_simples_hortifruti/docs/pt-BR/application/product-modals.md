---
id: "DOC-APP-MODALS"
title: "Modais de Produto e Deep Linking por URL"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Application"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Modais de Produto e Deep Linking por URL

> Idioma: Português (pt-BR) | [English (EN)](../../en/application/product-modals.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Modais de Produto e Deep Linking por URL

O módulo [assets/js/modal.js](../../../assets/js/modal.js) gerencia a experiência detalhada do produto e a navegação por URL única.

## Funcionalidades Principais

1. **Deep Linking com URL Única (`?p=ID`)**:
   - Cada produto possui uma URL exclusiva (ex: `https://seusite.com/?p=HF007`).
   - Ao abrir um produto, a URL no navegador é atualizada via `history.pushState` sem recarregar a página.
   - Ao fechar o modal (botão fechar, tecla Escape ou clique fora), o parâmetro `?p=` é removido.
   - Suporte nativo aos botões Voltar/Avançar do navegador (`window.onpopstate`).
2. **Rodapé de Ações Fixo (Sticky Footer)**:
   - Os botões "Adicionar ao Carrinho" e "Encomendar no WhatsApp" permanecem fixos no rodapé da janela do modal, permitindo compra rápida mesmo em telas de celular compridas.
3. **Seletor Inteligente de Variações**:
   - O container de variações é renderizado apenas quando o produto possui variações cadastradas. Produtos unitários simples não apresentam caixas vazias.

Consulte [storefront-catalog.md](storefront-catalog.md) para o funcionamento da vitrine.
