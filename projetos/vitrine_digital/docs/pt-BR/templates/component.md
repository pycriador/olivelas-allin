---
title: "Componente"
status: "DRAFT"
owner: "time-ou-role"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
review_date: "YYYY-MM-DD"
version: "1.0"
id: "CMP-XXX"
type: "Architecture"
---

# Componente

> Language: [English (EN)](../../en/templates/component.md) | Português (pt-BR)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

Visão operacional e orientada à implementação de um único componente.

## ID

| Campo | Valor |
| --- | --- |
| ID do Componente | CMP-XXX / nome-estavel |
| Nome canônico | |
| Proprietário | |

## Propósito

<!-- Por que este componente existe. -->

## Tipo

| Campo | Valor |
| --- | --- |
| Tipo | biblioteca / serviço / worker / gateway / batch / UI / dados / infra / outro |
| Deployable | sim / não / Unknown |
| Criticidade | |

## Responsabilidades

| Responsabilidade | Notas |
| --- | --- |
| | |

## Não-Responsabilidades

| Não-responsabilidade | Proprietário / em outro lugar |
| --- | --- |
| | |

## Tecnologia

| Tema | Escolha | Classificação |
| --- | --- | --- |
| Linguagem / runtime | | Confirmed / Inferred / Unknown |
| Framework | | Confirmed / Inferred / Unknown |
| Datastore | | Confirmed / Inferred / Unknown / Não aplicável |
| Outro | | |

## Entradas

| Entrada | Fonte | Formato / contrato |
| --- | --- | --- |
| | | |

## Saídas

| Saída | Destino | Formato / contrato |
| --- | --- | --- |
| | | |

## Dependências

| Dependência | ID | Propósito | Obrigatória | Direção | Classificação |
| --- | --- | --- | --- | --- | --- |
| | CMP/SVC/externo | | sim / não | inbound / outbound | Confirmed / Inferred / Unknown |

## Interfaces

| Interface | Tipo | ID do contrato / documento | Notas Authn / Authz |
| --- | --- | --- | --- |
| | API / evento / mensagem / arquivo / comando / outro | | |

## Dados

| Tema | Resumo | Classificação |
| --- | --- | --- |
| Dados de propriedade | | Confirmed / Inferred / Unknown / Não aplicável |
| Dados lidos | | Confirmed / Inferred / Unknown / Não aplicável |
| Dados escritos | | Confirmed / Inferred / Unknown / Não aplicável |
| Classificação / sensibilidade | | Confirmed / Inferred / Unknown / Não aplicável |

<!-- Nunca documente valores de secrets. -->

## Configuração

| Nome | Propósito | Fonte | Obrigatório | Secret |
| --- | --- | --- | --- | --- |
| | | env / arquivo / vault / outro | sim / não | sim / não |

<!-- Nunca documente valores de secrets. -->

## Segurança

| Tópico | Resumo |
| --- | --- |
| Envolvimento em fronteira de confiança | |
| Autenticação | |
| Autorização | |
| Manipulação de dados sensíveis | |
| Secrets (referências apenas) | |
| Riscos | |

## Observabilidade

| Sinal | Status | Notas |
| --- | --- | --- |
| Logging | Implementado / Parcial / Não aplicável / Não documentado | |
| Metrics | Implementado / Parcial / Não aplicável / Não documentado | |
| Tracing | Implementado / Parcial / Não aplicável / Não documentado | |

## Tratamento de Falhas

| Falha | Detecção | Resposta | Classificação |
| --- | --- | --- | --- |
| | | | Confirmed / Inferred / Unknown |

## Operações

| Tópico | Notas |
| --- | --- |
| Deploy | |
| Escalabilidade | |
| Health checks | |
| Migração / rollback | |
| Runbooks | |
| SLIs / SLOs | Unknown / Não aplicável |

## Documentos Relacionados

| Relação | ID do documento | Caminho |
| --- | --- | --- |
| arquitetura | | |
| contratos | | |
| runbooks | | |
| seguranca | | |
| ADRs | | |