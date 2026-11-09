---
title: "Templates"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-11"
updated: "2026-09-11"
version: "1.0"
---

# Templates

> Language: [English (EN)](../../en/templates/README.md) | Português (pt-BR)
>
> Status: ACCEPTED

Templates reutilizáveis de documentação para este projeto. Copie um template para a categoria apropriada, substitua os placeholders e defina o status do ciclo de vida do documento no frontmatter YAML.

## Requisito de Frontmatter

Todo documento de conteúdo deve começar com frontmatter YAML. Campos obrigatórios:

| Campo | Obrigatório | Notas |
| --- | --- | --- |
| `title` | Sim | Título do documento |
| `status` | Sim | Ciclo de vida: `DRAFT`, `ACCEPTED`, `DEPRECATED`, etc. |
| `owner` | Sim | Time ou role |
| `updated` | Sim | Última atualização de conteúdo (`YYYY-MM-DD`) |
| `created` | Não | Data de primeira publicação |
| `review_date` | Não | Alvo de próxima ou última revisão |
| `version` | Não | String de versão do documento |

Mantenha o blockquote do seletor de idioma após o H1. Não coloque metadados de ciclo de vida no blockquote.

Para ADRs: `status` no frontmatter é o ciclo de vida do documento; a seção `## Status` é o status da decisão (`Proposed` / `Accepted` / ...). São independentes.

## Templates Disponíveis

| Template | Arquivo | Use para |
| --- | --- | --- |
| Project Overview | [project-overview.md](project-overview.md) | Propósito, escopo e mapa do sistema |
| Architecture | [architecture.md](architecture.md) | Documento de arquitetura consolidado |
| System Context | [system-context.md](system-context.md) | Sistema no seu ecossistema |
| Component | [component.md](component.md) | Visão operacional/de detalhe de um componente |
| Data Flow | [data-flow.md](data-flow.md) | Um caminho de dados significativo |
| Contract | [contract.md](contract.md) | APIs, eventos, mensagens, arquivos, comandos e outras interfaces |
| Service Profile | [service-profile.md](service-profile.md) | Cartão de identidade operacional do serviço |
| Runbook | [runbook.md](runbook.md) | Procedimento operacional |
| Security | [security.md](security.md) | Visão geral da postura de segurança |
| ADR | [adr.md](adr.md) | Registro de decisão de arquitetura |
| AI Task Context | [ai-task-context.md](ai-task-context.md) | Pacote de contexto para tarefa de IA |
| Claim | [claim.md](claim.md) | Claim técnico único com evidência |

## Regras de Uso

1. Mantenha seções mesmo vazias — marque `Not applicable` ou `Unknown` em vez de deletar estrutura arbitrariamente.
2. Não trate toda seção como conteúdo obrigatório para todo projeto.
3. Nunca preencha placeholders com fatos inventados do projeto.
4. Defina `status: "DRAFT"` no frontmatter até revisar; mova para `ACCEPTED` após revisão.
5. Não invente métricas, alvos, padrões arquiteturais, SLOs, alertas, DR ou comandos de runbook sem evidência.
6. Nunca incorpore secrets na documentação.