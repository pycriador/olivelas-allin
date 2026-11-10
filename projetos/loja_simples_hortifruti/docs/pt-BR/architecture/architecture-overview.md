---
id: "DOC-ARCH-OVR"
title: "Visão Geral da Arquitetura do Sistema"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Architecture"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Visão Geral da Arquitetura do Sistema

> Idioma: Português (pt-BR) | [English (EN)](../../en/architecture/architecture-overview.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Visão Geral da Arquitetura

O sistema **Hortifruti Natural** adota uma arquitetura estática desacoplada (Zero-Backend Single Page Application), projetada para máxima velocidade de carregamento, simplicidade de hospedagem e alta confiabilidade operacional.

```text
+-------------------------------------------------------------------------+
|                              NAVEGADOR                                  |
|                                                                         |
|  +------------------------+             +----------------------------+  |
|  |   Vitrine (index.html) |             |    Admin (admin/index.html)|  |
|  |  +------------------+  |             |  +-----------------------+ |  |
|  |  | Catalog Module   |  |             |  | Admin Manager Module  | |  |
|  |  | Cart Module      |  |             |  | Product CRUD & Stock  | |  |
|  |  | Modal & Routing  |  |             |  | JSON Backup / Restore | |  |
|  |  +--------+---------+  |             |  +-----------+-----------+ |  |
|  +-----------|------------+             +--------------|-------------+  |
|              |                                         |                |
|              +--------------------+--------------------+                |
|                                   |                                     |
|                         +---------v----------+                          |
|                         |  State Management  |                          |
|                         |  (Hybrid Storage)  |                          |
|                         +----+------------+--+                          |
|                              |            |                             |
|                              v            v                             |
|                      [LocalStorage]  [produtos.json]                    |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Service Worker (sw.js) - Cache First Assets / Stale While Reval   |  |
|  +-------------------------------------------------------------------+  |
+-----------------------------------|-------------------------------------+
                                    |
                    +---------------v---------------+
                    | WhatsApp API (wa.me Checkout) |
                    +-------------------------------+
```

## Componentes Arquiteturais

1. **Storefront Frontend ([index.html](../../../index.html))**: Interface de consumo com busca instantânea, filtragem por categorias, navegação com URLs amigáveis, modais dinâmicos e carrinho lateral interativo.
2. **Admin Panel ([admin/index.html](../../../admin/index.html))**: Painel de gerenciamento isolado para adição, edição, exclusão de produtos, alteração de estoque em lote e importação/exportação de catálogo JSON.
3. **Data Layer Híbrido ([assets/js/app.js](../../../assets/js/app.js))**: Mecanismo que carrega o catálogo inicial de [data/produtos.json](../../../data/produtos.json) e aplica sobreposições reativas gravadas no `localStorage`.
4. **Checkout Engine ([assets/js/cart.js](../../../assets/js/cart.js))**: Gerador de payload formatado para a API do WhatsApp com cálculo de subtotais, frete e dados de entrega.
5. **Offline Layer ([sw.js](../../../sw.js))**: Service Worker que garante funcionamento contínuo e carregamento instantâneo mesmo sem conectividade.

Para mais detalhes sobre os módulos internos, consulte [component-architecture.md](component-architecture.md).
