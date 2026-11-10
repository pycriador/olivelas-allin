---
id: "DOC-APP-CATALOG"
title: "Vitrine Virtual e Catálogo Dinâmico"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Application"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Vitrine Virtual e Catálogo Dinâmico

> Idioma: Português (pt-BR) | [English (EN)](../../en/application/storefront-catalog.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Vitrine Virtual e Catálogo Dinâmico

A vitrine principal ([index.html](../../../index.html)) apresenta a experiência de compra do cliente final.

## Principais Funcionalidades

1. **Barra de Pesquisa Unificada**: Localizada no topo da seção de catálogo (`#catalog-search-input`), filtra em tempo real por nome do produto, descrição, categoria ou tags.
2. **Pílulas de Categoria**: Filtros rápidos para alternar entre "Todas", "Frutas", "Verduras & Folhas", "Legumes", "Orgânicos" e "Temperos & Ervas".
3. **Ordenação Inteligente**: Ordenação por Menor Preço, Maior Preço, Nome (A-Z) ou Produtos em Destaque.
4. **Cards com Badges Informativos**:
   - `Sob Encomenda` (Verde claro / Âmbar)
   - `Última Unidade` (Laranja)
   - `Poucas Unidades` (Amarelo)
   - `Esgotado` (Cinza / Vermelho desabilitado)
   - `Destaque` / `Orgânico` (Verde)
5. **Paginação Inteligente**: Divisão suave em páginas com controles de anterior/próxima e contadores de itens visíveis.

Consulte [product-modals.md](product-modals.md) para detalhes do modal aberto a partir dos cards.
