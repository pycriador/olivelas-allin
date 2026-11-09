---
title: "Visão Geral do Projeto"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# AI WhatsApp Image Analyzer

> Language: [English (EN)](../en/project-overview.md) | Português (pt-BR)
>
> Status: ACCEPTED

## Propósito

O AI WhatsApp Image Analyzer é uma aplicação web que usa modelos de IA multimodais para analisar imagens compartilhadas via WhatsApp. Ele extrai automaticamente informações estruturadas (nomes de empresas, contatos, serviços, produtos, preços, endereços) de imagens promocionais e retorna uma representação JSON completa.

## Problema

Imagens promocionais compartilhadas via WhatsApp contêm informações valiosas de negócios que estão bloqueadas em formato de pixel. A extração manual é demorada, propensa a erros e não escala. Esta aplicação automatiza a extração, tornando o conteúdo das imagens pesquisável, estruturado e acionável.

## Escopo

| In scope | Notas |
| --- | --- |
| Upload de imagem por drag-and-drop e seletor de arquivo | JPEG, PNG, WebP |
| PWA Web Share Target | Receber imagens compartilhadas do WhatsApp |
| Análise de imagem com IA | GPT-5, GPT-4.1, Gemini 2.5 Flash via gateway Lovable |
| Saída JSON estruturada | OCR, detecção de objetos, extração de contatos |
| Sistema IAM com cotas | Roles global_admin, analyst, consumer |
| Geração de artes com IA | DALL-E 3, Flux, Imagen 3 |
| Landing page da vitrine | Portfólio de negócios via WhatsApp |
| Fila de moderação de artes | Submissões de consumidores com fluxo de aprovação |

## Não-Objetivos

| Não-objetivo | Justificativa |
| --- | --- |
| Análise de vídeo em tempo real | Escopo limitado a imagens estáticas |
| OCR multilíngue além de PT/EN | Modelos atuais cobrem PT/EN suficientemente |
| Processamento de pagamento | Cotas gerenciadas em BRL via IAM, sem integração de billing |
| App mobile nativo | PWA cobre casos de uso mobile via Web Share Target |

## Usuários / Consumidores

| Usuário / consumidor | Necessidade |
| --- | --- |
| Usuários finais (WhatsApp) | Compartilhar imagens promocionais e receber análise estruturada |
| Empresários | Exibir portfólio via landing page da vitrine |
| Global admins | Gerenciar grupos, usuários, tokens, prompts, cotas |
| Analistas | Visualizar resultados de análise, aprovar artes |
| Consumidores | Submeter artes para aprovação, visualizar próprias submissões |

## Arquitetura

- Visão geral: aplicação SSR em TanStack Start com backend Supabase, integração multi-provedor de IA (gateway Lovable, OpenAI, Gemini) e recursos PWA.
- Detalhes: [arquitetura.md](arquitetura.md)

## Componentes

| Componente | Responsabilidade | Documentação |
| --- | --- | --- |
| TanStack Start App | Roteamento SSR, UI, server functions | [arquitetura.md](arquitetura.md) |
| Backend Supabase | Auth, Storage, Postgres, Edge Functions | [infraestrutura/supabase.md](infraestrutura/supabase.md) |
| Pipeline de Visão IA | Análise de imagem, extração JSON, validação | [arquitetura.md](arquitetura.md) |
| Geração de Artes IA | Geração de imagem a partir do conteúdo analisado | [arquitetura.md](arquitetura.md) |
| Sistema IAM | Roles, grupos, cotas, API tokens | [arquitetura.md](arquitetura.md) |
| Landing Page Vitrine | Exibição de portfólio de negócios | [arquitetura.md](arquitetura.md) |

## Dependências

| Dependência | Tipo | Propósito | Classificação |
| --- | --- | --- | --- |
| Supabase | runtime | Auth, Storage, Database, Edge Functions | Confirmed |
| Lovable AI Gateway | runtime | Modelos de visão e geração de imagem | Confirmed |
| OpenAI API | runtime | Fallback de visão e geração de imagem | Confirmed |
| Google Gemini API | runtime | Visão direta e Imagen 3 | Confirmed |
| TanStack Start | build | Framework SSR | Confirmed |
| Tailwind CSS v4 | build | Estilização UI | Confirmed |
| shadcn/ui | build | Componentes UI | Confirmed |
| Drizzle ORM | build | Migrations de banco | Confirmed |

## Integrações

| Integração | Direção | Contrato | Documentação |
| --- | --- | --- | --- |
| Lovable AI Gateway | outbound | REST (chat completions, images) | [contratos/](contratos/) |
| OpenAI API | outbound | REST (chat completions, images) | [contratos/](contratos/) |
| Gemini API | outbound | REST (generateContent, predict) | [contratos/](contratos/) |
| Supabase Storage | bidirecional | Compatível com S3 (bucket images) | [infraestrutura/supabase.md](infraestrutura/supabase.md) |
| Supabase Auth | bidirecional | Autenticação baseada em JWT | [infraestrutura/supabase.md](infraestrutura/supabase.md) |
| WhatsApp | outbound | Links wa.me | [arquitetura.md](arquitetura.md) |

## Segurança

- Fronteiras de confiança: políticas RLS do Supabase, acesso baseado em role IAM, proteção CSRF nas server functions
- Authn / Authz: autenticação JWT Supabase, auth por hash de API token (Edge Functions), IAM baseado em roles (global_admin / analyst / consumer)
- Detalhes: [seguranca/seguranca.md](seguranca/seguranca.md)

## Observabilidade

| Tipo de sinal | Status |
| --- | --- |
| Logging | Parcial — console.log em server functions, logs de Edge Functions Supabase |
| Metrics | Parcial — tabela ai_usage_logs rastreia custo por modelo/grupo |
| Tracing | Não documentado |

## Operações

| Cenário | Runbook |
| --- | --- |
| Alta taxa de erro na análise de imagens | [operacoes/runbook.md](operacoes/runbook.md) |
| Esgotamento da cota de IA | [operacoes/perfil-do-servico.md](operacoes/perfil-do-servico.md) |

## Ambientes

| Ambiente | Propósito | Notas |
| --- | --- | --- |
| Lovable Preview | Desenvolvimento/preview | Auto-deploy do editor Lovable |
| Produção | Aplicação ao vivo | ai-wpp-image-analyzer.lovable.app |
| Estático (Vitrine Digital) | HTML/CSS/JS standalone | Publicável em qualquer CDN |

## Limitações Conhecidas

| Limitação | Impacto | Classificação |
| --- | --- | --- |
| Projeto Supabase único | Sem failover multi-região | Confirmed |
| Disponibilidade do modelo depende de provedores externos | Análise indisponível durante falhas de provedor | Confirmed |
| Gestão de cota é por grupo, não por usuário | Grupos grandes podem esgotar cotas mais rápido | Confirmed |
| Sem notificações em tempo real por webhook | Usuários devem fazer polling pelo resultado | Inferred |

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | [arquitetura.md](arquitetura.md) |
| Segurança | [seguranca/seguranca.md](seguranca/seguranca.md) |
| Contratos | [contratos/](contratos/) |
| Operações | [operacoes/](operacoes/) |
| Decisões | [decisoes/](decisoes/) |
| Infraestrutura | [infraestrutura/supabase.md](infraestrutura/supabase.md) |