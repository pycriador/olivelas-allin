---
title: "Perfil do Serviço"
status: "DRAFT"
owner: "time-ou-role"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
review_date: "YYYY-MM-DD"
version: "1.0"
service_id: "nome-estavel-do-servico"
criticality: "High"
---

# Perfil do Serviço

> Language: [English (EN)](../../en/templates/service-profile.md) | Português (pt-BR)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

Cartão de identidade operacional para um serviço ou capacidade. Vincule componentes de arquitetura e contratos; não duplique prosa ou schemas de componentes.

## Propósito

<!-- Por que este serviço existe e que resultado de usuário/capacidade fornece. -->

## Escopo

| In scope | Fora do escopo |
| --- | --- |
| | |

## Propriedade

**Obrigatório:** cada linha deve ter um proprietário nomeado **ou** o token `Unknown`.

| Papel | Proprietário | Notas |
| --- | --- | --- |
| Serviço / produto | <!-- nome ou Unknown --> | |
| Técnico | <!-- nome ou Unknown --> | |
| Operacional / on-call | <!-- nome ou Unknown --> | |
| Escalação | <!-- nome ou Unknown --> | |

## Criticidade

| Campo | Valor |
| --- | --- |
| Nível | Crítica / Alta / Média / Baixa / outro / Não definido |
| Justificativa | |
| Impacto ao usuário / negócio se indisponível | |

## Links de Arquitetura

| Tema | Link |
| --- | --- |
| Visão geral da arquitetura / componente | |
| Domínios de falha | |
| Mapa de dependências | |

## Dependências

| Dependência | Tipo | Criticidade | Impacto de falha | Detecção | Mitigação / recuperação |
| --- | --- | --- | --- | --- | --- |
| | runtime / build / deploy / operacional | | | | |

## Contratos (Relevantes para Confiabilidade)

| Contrato | Timeout | Retry | Idempotência | Notas |
| --- | --- | --- | --- | --- |
| | | | | |

## Níveis de Serviço

| SLI | SLO | Janela | Error budget | Classificação |
| --- | --- | --- | --- | --- |
| | ou N/A / Não definido | | ou N/A | |

## Modos de Falha (Resumo)

| Modo de falha | Impacto | Detecção | Runbook / recuperação |
| --- | --- | --- | --- |
| | | | |

## Observabilidade

| Tipo de sinal | Status | Notas / link |
| --- | --- | --- |
| Metrics | Implementado / Parcial / N/A / Não documentado | |
| Logs | | |
| Traces | | |
| Health checks | | |
| Alertas | | |

## Estado Operacional

| Como o estado é determinado | Sinais Healthy / Degraded / Unavailable |
| --- | --- |
| | |

## Deploy e Mudanças

| Tópico | Link / notas |
| --- | --- |
| Deploy / validar | |
| Postura de rollback | Seguro / parcial / irreversível / Unknown |
| Manutenção | |

## Recuperação

| Tópico | Status | Link |
| --- | --- | --- |
| Backup / restauração | Definido / N/A / Não definido | |
| RPO / RTO | Definido / Não definido | |
| Disaster recovery | Definido / Não definido | |

## Runbooks e Incidentes Relacionados

| Artefato | ID / caminho |
| --- | --- |
| Runbooks | |
| Incidentes materiais recentes | |

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | |
| Contratos | |
| Observabilidade | |