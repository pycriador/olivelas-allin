---
title: "ADR-001 — Seleção da Stack Tecnológica"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
deciders: "willian.o.jesus@gmail.com"
---

# ADR-001 — Seleção da Stack Tecnológica

> Language: [English (EN)](../../en/decisions/adr-001-tech-stack.md) | Português (pt-BR)
>
> Status: ACCEPTED

## Status

Aceita

## Data

2026-09-01

## Contexto

O projeto requer uma stack web moderna para uma aplicação de análise de imagem com IA com:
- SSR para SEO e performance
- Capacidades em tempo real para resultados de análise
- Armazenamento de arquivos para imagens
- Autenticação e autorização
- Iteração de desenvolvimento rápido via Lovable

## Problema

Qual stack tecnológica melhor atende aos requisitos do projeto, permitindo desenvolvimento e deploy rápidos através do Lovable?

## Decisão

Adotar a seguinte stack:
- **Framework**: TanStack Start (SSR) + React Router
- **UI**: Tailwind CSS v4 + shadcn/ui (Radix UI)
- **Runtime**: Bun
- **Backend**: Supabase (Auth, Storage, Postgres, Edge Functions)
- **IA**: Multi-provedor (gateway Lovable, OpenAI, Gemini)
- **ORM**: Drizzle ORM
- **Validação**: Zod
- **Deploy**: plataforma Lovable

## Alternativas Consideradas

| Alternativa | Prós | Contras | Por que não escolhida |
| --- | --- | --- | --- |
| Next.js + Vercel | Ecossistema maduro, grande comunidade | Mais pesado, lock-in Vercel | Lovable usa TanStack Start |
| Remix + Fly.io | Edge-first, leve | Ecossistema menor | Template do Lovable |
| SvelteKit | Leve, rápido | Ecossistema menor, menos suporte Lovable | Template do Lovable |
| Supabase + React puro | Mais simples | Sem SSR, menos SEO | Necessário SSR para páginas da vitrine |

## Consequências

| Positivas | Negativas | Neutras |
| --- | --- | --- |
| Desenvolvimento rápido via Lovable | Dependência do template Lovable | TanStack Start é mais novo |
| Backend integrado (Supabase) | Lock-in de vendor no Supabase | Multi-provedor de IA adiciona flexibilidade |
| Type-safe (TypeScript + Zod) | Curva de aprendizado do TanStack Start | Drizzle ORM é leve |
| Capacidades PWA | Complexidade PWA | Web Share Target depende do navegador |

## Riscos

| Risco | Mitigação | Classificação |
| --- | --- | --- |
| Dependência da plataforma Lovable | Código está no git, pode migrar | Confirmed |
| Supabase single-region | Aceitável para escala atual | Confirmed |
| Maturidade do TanStack Start | Desenvolvimento ativo, boa documentação | Inferred |

## Componentes Afetados

| Componente | Impacto | Documentação |
| --- | --- | --- |
| Todo o código da aplicação | Escolha da stack | [arquitetura.md](../arquitetura.md) |
| Pipeline de deploy | Auto-deploy Lovable | [arquitetura.md](../arquitetura.md) |
| Schema do banco | Supabase/Drizzle | [infraestrutura/supabase.md](../infraestrutura/supabase.md) |

## Contratos Afetados

| Contrato | Impacto | Documentação |
| --- | --- | --- |
| Todos os contratos de IA | Suporte multi-provedor | [contratos/](../contratos/) |
| Contratos Supabase | Auth, Storage, DB | [infraestrutura/supabase.md](../infraestrutura/supabase.md) |

## Rastreabilidade

```text
Arquitetura → Decisão → Componente → Contrato
```

| Camada | Referência |
| --- | --- |
| Arquitetura | [arquitetura.md](../arquitetura.md) |
| Decisão (este ADR) | ADR-001 |
| Componente | TanStack Start App |
| Contrato | Todos os contratos |
| Evidência de implementação | package.json, vite.config.ts |

## Decisões Relacionadas

| ADR | Relacionamento |
| --- | --- |
| — | — |

## Referências

| Referência | Localização |
| --- | --- |
| Documento de arquitetura | [arquitetura.md](../arquitetura.md) |
| Projeto Lovable | https://lovable.dev/projects/6949f5e1-5874-47a3-b30e-cfb703685ed6 |
| App ao vivo | https://ai-wpp-image-analyzer.lovable.app |