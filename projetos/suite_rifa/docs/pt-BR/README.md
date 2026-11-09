---
title: "Documentação RaffleHub"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
---

# Documentação RaffleHub

> Language: pt-BR | [English](../en/README.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

Índice central de documentação do RaffleHub — plataforma SaaS multi-tenant para gerenciamento de rifas no mercado brasileiro.

## Visão Geral do Projeto

| Campo | Valor |
| --- | --- |
| Finalidade | SaaS multi-tenant para gerenciamento de rifas |
| Mercado | Brasil (pt-BR, BRL, PIX) |
| Stack | React 19, TypeScript, TanStack Start, Supabase, Cloudflare Workers |
| Repositório | [pycriador-org/raffle-suite-hub](https://github.com/pycriador-org/raffle-suite-hub) |

## Inventário de Documentação

### Arquitetura

| Documento | Categoria | Status | Proprietário | Atualizado |
| --- | --- | --- | --- | --- |
| [overview.md](architecture/overview.md) | Arquitetura | ACCEPTED | rafflehub | 2026-08-18 |
| [data-model.md](architecture/data-model.md) | Arquitetura | ACCEPTED | rafflehub | 2026-08-18 |
| [components.md](architecture/components.md) | Arquitetura | ACCEPTED | rafflehub | 2026-08-18 |

### Aplicação

| Documento | Categoria | Status | Proprietário | Atualizado |
| --- | --- | --- | --- | --- |
| [campaigns.md](application/campaigns.md) | Aplicação | ACCEPTED | rafflehub | 2026-08-18 |
| [numbers.md](application/numbers.md) | Aplicação | ACCEPTED | rafflehub | 2026-08-18 |
| [participants.md](application/participants.md) | Aplicação | ACCEPTED | rafflehub | 2026-08-18 |
| [payments.md](application/payments.md) | Aplicação | ACCEPTED | rafflehub | 2026-08-18 |
| [auth.md](application/auth.md) | Aplicação | ACCEPTED | rafflehub | 2026-08-18 |
| [permissions.md](application/permissions.md) | Aplicação | ACCEPTED | rafflehub | 2026-08-18 |

### Contratos

| Documento | Categoria | Status | Proprietário | Atualizado |
| --- | --- | --- | --- | --- |
| [rpc-functions.md](contracts/rpc-functions.md) | Contratos | ACCEPTED | rafflehub | 2026-08-18 |
| [api-routes.md](contracts/api-routes.md) | Contratos | ACCEPTED | rafflehub | 2026-08-18 |

### Operações

| Documento | Categoria | Status | Proprietário | Atualizado |
| --- | --- | --- | --- | --- |
| [deployment.md](operations/deployment.md) | Operações | ACCEPTED | rafflehub | 2026-08-18 |
| [environment.md](operations/environment.md) | Operações | ACCEPTED | rafflehub | 2026-08-18 |
| [migrations.md](operations/migrations.md) | Operações | ACCEPTED | rafflehub | 2026-08-18 |

### Segurança

| Documento | Categoria | Status | Proprietário | Atualizado |
| --- | --- | --- | --- | --- |
| [overview.md](security/overview.md) | Segurança | ACCEPTED | rafflehub | 2026-08-18 |

## Cadeias de Divulgação Progressiva

```text
Arquitetura → Contratos → Operações → Recuperação
Arquitetura → Limites de Confiança → Ativos → Ameaças → Controles → Operações → Resposta
```

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Visão geral da arquitetura | [architecture/overview.md](architecture/overview.md) |
| Modelo de dados | [architecture/data-model.md](architecture/data-model.md) |
| Modelo de segurança | [security/overview.md](security/overview.md) |
| Implantação | [operations/deployment.md](operations/deployment.md) |
