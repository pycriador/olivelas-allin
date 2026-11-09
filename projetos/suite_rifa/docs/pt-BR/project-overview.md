---
title: "RaffleHub SaaS"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-17"
updated: "2026-08-17"
version: "1.0"
---

# RaffleHub SaaS

> Language: pt-BR | [English (EN)](../en/project-overview.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Propósito

RaffleHub é uma plataforma SaaS multi-tenant para gerenciamento de rifas digitais. Permite que organizações criem, publiquem e gerenciem campanhas de rifa onde participantes compram tickets numerados. A plataforma cobre o ciclo de vida completo: criação de campanha, geração de números, reserva, vendas, gestão de participantes e execução do sorteio.

## Problema

O gerenciamento manual de rifas é propenso a erros, carece de transparência e não escala. RaffleHub resolve isso fornecendo uma plataforma centralizada e auditável onde cada organização gerencia suas próprias campanhas, participantes e dados financeiros com rastreabilidade completa.

## Escopo

| Em escopo | Notas |
| --- | --- |
| Gerenciamento multi-tenant de organizações | RBAC, planos, limites, fundação de billing |
| Ciclo de vida de campanhas | DRAFT → PUBLISHED → PAUSED → FINISHED → ARCHIVED |
| Geração e reserva de números | Grid lazy, reservas com TTL, controle de concorrência |
| Gestão de participantes | Deduplicação por telefone por campanha |
| Vendas manuais com atribuição de números | Venda rápida, venda completa, edição, transferência, cancelamento |
| Gerenciamento de imagens | Capa/galeria com proxy, signed URLs |
| Páginas públicas de campanha | Acesso anônimo via slug, exibição do grid de números |
| Log de auditoria | Todas as mutações registradas com ator/contexto |
| Administração da plataforma | Gestão multi-tenant pelo GLOBAL_ADMIN |

| Fora do escopo | Rationale |
| --- | --- |
| Processamento de pagamentos online | Adiado para Sprint 6+ (PIX, gateways) |
| Engine de sorteio / loteria | Adiado para Sprint 7+ |
| Apps móveis nativos | Web-first; design responsivo via Tailwind |
| API para integrações de terceiros | Consideração futura |
| Chat / mensagens em tempo real | Fora do escopo |
| Marketplace white-label | Consideração futura |

## Usuários / Consumidores

| Usuário / consumidor | Necessidade |
| --- | --- |
| Owner da Organização | Controle total: configurações, billing, membros, campanhas, números, vendas |
| Admin da Organização | Gestão de campanhas, membros, operações de números/vendas |
| Membro da Organização | Operações de campanhas, números, vendas, busca de participantes |
| Viewer da Organização | Acesso somente leitura a campanhas, números, participantes, vendas |
| Visitante anônimo | Navegar campanhas públicas, ver números disponíveis |
| Admin da Plataforma (GLOBAL_ADMIN) | Gestão multi-tenant, métricas da plataforma |

## Arquitetura

- Visão geral: TanStack Start (SSR) + React 19 frontend, Supabase (PostgreSQL + Auth + Storage + Edge Functions) backend, hospedagem via Lovable Cloud. Toda lógica de negócio vive em funções RPC PostgreSQL (SECURITY DEFINER). O frontend nunca escreve diretamente nas tabelas.
- Detalhes: [architecture/overview.md](architecture/overview.md)

## Componentes

| Componente | Responsabilidade | Documentação |
| --- | --- | --- |
| Frontend (React 19) | Renderização de UI, formulários, gerenciamento de estado | [application/frontend-app.md](application/frontend-app.md) |
| RPCs Supabase | Lógica de negócio, validação, autorização, auditoria | [application/backend-rpcs.md](application/backend-rpcs.md) |
| Banco PostgreSQL | Armazenamento de dados, RLS, triggers | [application/database.md](application/database.md) |
| Supabase Auth | Autenticação OAuth, gerenciamento de sessão | [application/authentication.md](application/authentication.md) |
| Supabase Storage | Armazenamento de imagens (bucket org-assets) | [application/database.md](application/database.md) |
| Servidor TanStack Start | SSR, server functions, middleware | [application/frontend-app.md](application/frontend-app.md) |
| Sistema RBAC | 22 permissões, 4 roles de org + GLOBAL_ADMIN | [application/permissions.md](application/permissions.md) |

## Dependências

| Dependência | Tipo | Finalidade | Classificação |
| --- | --- | --- | --- |
| Supabase (PostgreSQL) | runtime | Banco de dados, RPCs, RLS, real-time | Confirmado |
| Supabase Auth | runtime | OAuth (Google), gerenciamento de sessão | Confirmado |
| Supabase Storage | runtime | Armazenamento de imagens com signed URLs | Confirmado |
| Lovable Cloud | runtime | Hospedagem, deploy, CI/CD | Confirmado |
| Google OAuth | externo | Provedor de autenticação | Confirmado |
| TanStack Start | build | Framework SSR, routing, server functions | Confirmado |
| React 19 | build | Biblioteca de renderização UI | Confirmado |
| Tailwind CSS 4 | build | Framework CSS utility-first | Confirmado |
| shadcn/ui + Radix | build | Biblioteca de componentes acessíveis | Confirmado |
| Zustand | build | Estado no cliente (seleção de tenant) | Confirmado |
| TanStack Query | build | Gerenciamento de estado do servidor, cache | Confirmado |
| React Hook Form + Zod | build | Validação e tratamento de formulários | Confirmado |
| Recharts | build | Gráficos e visualizações do dashboard | Confirmado |
| date-fns | build | Formatação e manipulação de datas | Confirmado |
| Sonner | build | Notificações toast | Confirmado |

## Integrações

| Integração | Direção | Contrato | Documentação |
| --- | --- | --- | --- |
| Google OAuth | saída | Fluxo de código de autorização OAuth 2.0 | [application/authentication.md](application/authentication.md) |
| Plataforme Supabase | bidirecional | REST API + WebSocket (RPCs, Auth, Storage, Realtime) | [contracts/rest-api.md](contracts/rest-api.md) |
| Lovable Cloud | bidirecional | Git push → auto-deploy | Não documentado |

## Segurança

- Limites de confiança: Supabase RLS impõe isolamento multi-tenant no nível do banco. Todas as RPCs são SECURITY DEFINER (executam como owner da função, bypassam RLS mas validam permissões manualmente).
- Autenticação / Autorização: Google OAuth via Lovable Cloud Auth → Supabase JWT → middleware valida Bearer tokens → attachSupabaseAuth cria cliente autenticado por request.
- Detalhes: [security/overview.md](security/overview.md)

## Observabilidade

| Tipo de sinal | Status |
| --- | --- |
| Logging | Implementado (console.error, módulo error-capture) |
| Métricas | Parcial (métricas via dashboard RPC, sem APM) |
| Tracing | Não Aplicável (serverless) |

Detalhes: [operations/observability.md](operations/observability.md)

## Operações

| Cenário | Runbook |
| --- | --- |
| Migração de schema do banco | Não documentado |
| Gerenciamento do projeto Supabase | Não documentado |
| Rollback de deploy | Não documentado |

## Ambientes

| Ambiente | Finalidade | Notas |
| --- | --- | --- |
| Desenvolvimento | Desenvolvimento local | `vite dev` com hot reload |
| Produção | Deploy ao vivo | Lovable Cloud → Supabase |

## Limitações Conhecidas

| Limitação | Impacto | Classificação |
| --- | --- | --- |
| Sem assinaturas real-time ainda | Números não sincronizam entre abas/navegadores em tempo real | Confirmado |
| Sem processamento de pagamentos | Vendas são apenas manuais; sem checkout automatizado | Confirmado |
| Sem engine de sorteio | Execução do sorteio é manual/fora do escopo | Confirmado |
| Sem exportação CSV ainda | Exportação de dados é manual | Confirmado |
| Sem sistema de email/notificação | Participantes não recebem confirmações | Confirmado |
| .env commitado no repo | Segredos visíveis no histórico git | Confirmado |
| Moeda única por organização | Não é possível lidar com campanhas multi-moeda | Confirmado |

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | [architecture/overview.md](architecture/overview.md) |
| Segurança | [security/overview.md](security/overview.md) |
| Contratos | [contracts/rest-api.md](contracts/rest-api.md) |
| Decisões | [decisions/adr-001-tech-stack.md](decisions/adr-001-tech-stack.md) |
| Contexto IA | [ai-context.md](ai-context.md) |
