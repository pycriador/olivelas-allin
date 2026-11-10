---
id: "DOC-ROOT-README"
title: "Visão Geral da Documentação"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Overview"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Visão Geral da Documentação

> Idioma: Português (pt-BR) | [English (EN)](../en/README.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


Bem-vindo à documentação oficial do projeto **Hortifruti Natural - Loja de Produtos**. Este repositório contém uma aplicação web moderna de comércio eletrônico para hortifruti, com catálogo dinâmico, carrinho de compras inteligente, finalização de pedidos diretamente via WhatsApp e um painel administrativo completo para controle de produtos e estoque.

## Estrutura da Documentação

A documentação está organizada de forma modular e bilíngue (`pt-BR` e `en`), cobrindo todas as dimensões de engenharia do projeto:

| Área | Descrição | Documentos Principais |
| --- | --- | --- |
| **Visão Geral & IA** | Ponto de partida e contexto para assistentes inteligentes | [ai-context.md](ai-context.md) |
| **Arquitetura** | Decisões estruturais, reatividade client-side e PWA | [architecture/architecture-overview.md](architecture/architecture-overview.md), [architecture/component-architecture.md](architecture/component-architecture.md), [architecture/state-management.md](architecture/state-management.md), [architecture/pwa-offline-strategy.md](architecture/pwa-offline-strategy.md) |
| **Aplicação** | Detalhamento dos módulos de vitrine, admin, carrinho e modais | [application/storefront-catalog.md](application/storefront-catalog.md), [application/admin-panel.md](application/admin-panel.md), [application/cart-and-checkout.md](application/cart-and-checkout.md), [application/product-modals.md](application/product-modals.md) |
| **Contratos** | Esquemas de dados, chaves de armazenamento e mensagens | [contracts/produtos-json-schema.md](contracts/produtos-json-schema.md), [contracts/localstorage-schema.md](contracts/localstorage-schema.md), [contracts/whatsapp-message-contract.md](contracts/whatsapp-message-contract.md) |
| **Operações** | Execução local, publicação em produção e manutenção | [operations/local-development.md](operations/local-development.md), [operations/deployment.md](operations/deployment.md), [operations/catalog-maintenance.md](operations/catalog-maintenance.md) |
| **Segurança & Privacidade** | Modelo de segurança de aplicação estática e privacidade | [security/client-security-model.md](security/client-security-model.md), [security/privacy-and-data-handling.md](security/privacy-and-data-handling.md) |

## Princípios de Engenharia do Projeto

1. **Zero Backend Runtime**: Arquitetura 100% estática executável em qualquer CDN ou servidor estático simples.
2. **Alta Performance & Zero Bloat**: Vanilla ES6+ Modules sem frameworks pesados ou dependências externas em tempo de execução.
3. **Persistência Híbrida Inteligente**: Catálogo base em JSON versionado (`data/produtos.json`) com sincronização e override reativo no `localStorage` do navegador.
4. **Experiência Mobile-First**: Interface totalmente responsiva, PWA com suporte offline e checkout integrado ao WhatsApp.
