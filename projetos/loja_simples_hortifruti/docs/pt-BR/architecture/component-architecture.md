---
id: "DOC-ARCH-COMP"
title: "Arquitetura de Componentes e Módulos"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Architecture"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Arquitetura de Componentes e Módulos

> Idioma: Português (pt-BR) | [English (EN)](../../en/architecture/component-architecture.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Arquitetura de Componentes e Módulos

O código JavaScript da aplicação é estruturado em módulos ES6 puros e independentes:

```text
assets/js/
├── app.js            # Inicializador e orquestrador principal da vitrine
├── catalog.js        # Renderização do catálogo e cálculo de badges de estoque
├── cart.js           # Carrinho de compras, cálculos e envio para WhatsApp
├── modal.js          # Modal interativo de detalhes e roteamento de URL (?p=ID)
├── search.js         # Busca instantânea com debounce e busca multi-campo
├── filters.js        # Filtros por categoria e ordenação
├── pagination.js     # Controles e cálculo de páginas do catálogo
├── whatsapp.js       # Formatador de payload de mensagem para a API do WhatsApp
└── utils.js          # Formatadores de moeda (R$), debounce e helpers de DOM
```

## Descrição dos Módulos

### 1. `app.js` (Orquestrador da Aplicação)
- Carrega e unifica os produtos do arquivo [data/produtos.json](../../../data/produtos.json) com o `localStorage`.
- Inicializa os módulos de busca, filtros, paginação, carrinho e modal de produto.
- Gerencia o estado global de produtos e configurações da loja.

### 2. `catalog.js` (Catálogo e Vitrine)
- Gerencia o estado de filtros (`categoriaAtiva`, `termoBusca`, `ordenacao`, `paginaAtual`).
- Renderiza os cards de produtos com badges dinâmicos de status ("Sob Encomenda", "Última Unidade", "Poucas Unidades", "Esgotado", "Destaque").
- Comunica-se com o modal ao clicar em qualquer produto.

### 3. `modal.js` (Modal e Roteamento)
- Abre a visualização detalhada do item ao clicar no card ou ao carregar a página com `?p=HF007`.
- Sincroniza a URL sem recarregar a tela (`pushState` e `replaceState`).
- Gerencia a seleção de variações e quantidade, mantendo o rodapé de compra sempre visível.

### 4. `cart.js` (Carrinho e Checkout)
- Mantém a lista de itens adicionados no `localStorage` (`hortifruti_carrinho`).
- Calcula subtotal, frete e total dinamicamente.
- Valida o formulário de entrega e despacha para [assets/js/whatsapp.js](../../../assets/js/whatsapp.js).

Consulte [state-management.md](state-management.md) para detalhes do fluxo reativo.
