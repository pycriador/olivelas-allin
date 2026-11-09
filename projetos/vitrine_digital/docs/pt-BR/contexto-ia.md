---
title: "Contexto de IA"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# Contexto de IA

> Language: [English (EN)](../en/ai-context.md) | Português (pt-BR)
>
> Status: ACCEPTED

## Propósito

Ponto de entrada para agentes de IA e humanos que consomem esta documentação. Comece aqui e siga os links — não carregue o corpus inteiro.

## Sequência de Início

1. Leia este documento → entenda escopo e fronteiras
2. Siga a navegação até a profundidade necessária
3. Aplique regras de resposta e restrições de segurança

## Contexto do Projeto

| Campo | Valor |
| --- | --- |
| Projeto | AI WhatsApp Image Analyzer |
| Tipo | Aplicação web (SSR + PWA) |
| Stack | TanStack Start, React, TypeScript, Tailwind CSS v4, Supabase |
| Runtime | Bun |
| Função principal | Análise de imagem com IA e extração estruturada de dados |
| Deploy | Lovable (ai-wpp-image-analyzer.lovable.app) |

## Mapa de Conhecimento

| Nível | Documento | Propósito |
| --- | --- | --- |
| 0 — Entrada | Este arquivo (contexto-ia.md) | Navegação, escopo, fronteiras |
| 1 — Contexto | [visao-geral.md](visao-geral.md) | Por que o projeto existe, escopo, usuários |
| 2 — Arquitetura | [arquitetura.md](arquitetura.md) | Estrutura do sistema, componentes, relacionamentos |
| 3 — Contratos | [contratos/](contratos/) | Fronteiras de API, schemas de dados |
| 4 — Operações | [operacoes/perfil-do-servico.md](operacoes/perfil-do-servico.md) | Identidade operacional, modos de falha |
| 5 — Segurança | [seguranca/seguranca.md](seguranca/seguranca.md) | Fronteiras de confiança, auth, controles |

## Regras Principais

| Regra | Referência |
| --- | --- |
| Disclosure progressivo da arquitetura | Contexto → Sistema → Componentes → Interfaces → Implementação |
| Contratos como fronteiras | Arquitetura → Componente → Contrato → Produtor/Consumidor |
| Operações como loop | Operar → Observar → Detectar → Diagnosticar → Responder → Recuperar → Aprender → Melhorar |
| Segurança como loop | Ativos → Ameaças → Riscos → Requisitos → Controles → Evidência → Monitoramento → Resposta → Revisão |
| Metadados AI-ready | Contexto → Conhecimento → Relacionamentos → Evidência → Restrições → Ações |
| Classificação de claims | Confirmed / Inferred / Unknown / Proposed |
| Sem fatos inventados | Prefira Unknown a SLOs, métricas ou secrets inventados |

## Arquivos de Entrada

| Arquivo | Propósito |
| --- | --- |
| AGENTS.md | Entrada para agentes de coding (stack, comandos, fronteiras) |
| contexto-ia.md | Este arquivo — entrada de documentação AI-ready |

## Não-Objetivos

- Sem RAG, embeddings ou vector DB
- Sem wiring MCP
- Sem especificação de UX de chatbot
- Sem especificação de produto de busca

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | [arquitetura.md](arquitetura.md) |
| Segurança | [seguranca/seguranca.md](seguranca/seguranca.md) |
| Contratos | [contratos/](contratos/) |
| Operações | [operacoes/](operacoes/) |