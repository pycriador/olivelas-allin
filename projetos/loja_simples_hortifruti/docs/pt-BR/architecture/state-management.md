---
id: "DOC-ARCH-STATE"
title: "Gerenciamento de Estado Reativo Client-Side"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Architecture"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Gerenciamento de Estado Reativo Client-Side

> Idioma: Português (pt-BR) | [English (EN)](../../en/architecture/state-management.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Gerenciamento de Estado Reativo Client-Side

O gerenciamento de estado da aplicação combina dados imutáveis versionados com mutações em tempo de execução no navegador.

```text
[produtos.json (Base SoT)]
         │
         ▼
[fetch('/data/produtos.json')] ──▶ [Mescla com localStorage('hortifruti_produtos')]
                                                │
                                                ▼
                                    [Estado Global em Memória]
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
          [Vitrine / Catálogo]         [Modal de Detalhes]           [Carrinho de Compras]
          - Filtros & Busca            - Seleção de Variação         - Quantidade de Itens
          - Badges de Estoque          - Sincronização de URL        - Cálculo de Frete
```

## Resolução de Status de Estoque

A lógica de resolução de estoque nos módulos de visualização executa a seguinte ordem de prioridade:
1. Se `sob_encomenda === true` ou `status_disponibilidade === 'sob_encomenda'`: exibe o badge **Sob Encomenda** e botão de encomendar.
2. Se `estoque_atual === 0` ou `esgotado === true`: exibe o badge **Esgotado** e desativa o botão de compra.
3. Se `estoque_atual === 1`: exibe o badge de destaque **Última Unidade**.
4. Se `estoque_atual > 1` e `estoque_atual <= 5`: exibe o badge de alerta **Poucas Unidades**.
5. Se `estoque_atual > 5`: exibe status normal de disponibilidade com quantidade informada.

Para detalhes sobre as chaves salvas no navegador, consulte [../contracts/localstorage-schema.md](../contracts/localstorage-schema.md).
