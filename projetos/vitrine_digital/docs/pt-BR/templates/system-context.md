---
title: "Contexto do Sistema"
status: "DRAFT"
owner: "time-ou-role"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
review_date: "YYYY-MM-DD"
version: "1.0"
---

# Contexto do Sistema

> Language: [English (EN)](../../en/templates/system-context.md) | Português (pt-BR)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

Use nomes reais do projeto; não invente atores fictícios para sistemas reais.

## Propósito

<!-- Responda: onde este sistema se encaixa no ecossistema? -->

## Sistema

| Campo | Valor |
| --- | --- |
| Nome | |
| Propósito | |
| Proprietário | |
| Resumo da fronteira | |

## Usuários

| Usuário | Necessidade | Interação |
| --- | --- | --- |
| | | |

## Consumidores

| Consumidor | O que consomem | Contrato |
| --- | --- | --- |
| | | |

## Sistemas Externos

| Sistema externo | Papel | Direção | Classificação |
| --- | --- | --- | --- |
| | | inbound / outbound / bidirecional | Confirmed / Inferred / Unknown |

## Dependências

| Dependência | Tipo | Propósito | Classificação |
| --- | --- | --- | --- |
| | runtime / data / operacional / outro | | Confirmed / Inferred / Unknown |

## Entradas

| Entrada | Fonte | Formato / contrato |
| --- | --- | --- |
| | | |

## Saídas

| Saída | Destino | Formato / contrato |
| --- | --- | --- |
| | | |

## Relações Relevantes

| De | Para | Relação | Notas |
| --- | --- | --- | --- |
| | | depende de / chama / publica / consome / outro | |

## Diagrama de Contexto

```mermaid
flowchart LR
  Usuario --> Sistema
  Sistema --> SistemaExterno
  SistemaExterno --> Sistema
```

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | |
| Fluxo de dados | |
| Contratos | |