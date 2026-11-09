---
title: "Stack Tecnologica"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Stack Tecnologica

> 🇧🇷 Language: Portugues do Brasil

## Framework e Roteamento

| Dependencia | Versao | Finalidade |
|---|---|---|
| React | 19.2 | UI componentizada |
| TanStack Router | 1.170 | Roteamento file-based tipado |
| TanStack Start | 1.168 | SSR via Nitro, server functions |
| React DOM | 1.9.2 | Renderizacao DOM |

## Interface do Usuario

| Dependencia | Versao | Finalidade |
|---|---|---|
| Tailwind CSS | 4.2 | Utilitarios CSS com oklch |
| Radix UI | 25+ primitivas | Componentes acessiveis (Dialog, Select, Tabs, Popover, etc.) |
| shadcn/ui | — | Padrao de componentes sobre Radix |
| Lucide React | 0.575 | Icones |
| Recharts | 2.15 | Graficos do dashboard |
| Sonner | 2.0 | Toasts/notificacoes |
| Vaul | 1.1 | Drawer lateral |
| cmdk | 1.1 | Command palette |
| Embla Carousel React | 8.6 | Carrossel |
| React Day Picker | 9.14 | Seletor de datas |
| React Resizable Panels | 4.6 | Paineis redimensionaveis |
| Input OTP | 1.4 | Input de codigo OTP |
| tw-animate-css | 1.3 | Animacoes Tailwind |
| class-variance-authority | 0.7 | Variacoes de estilo |
| clsx | 2.1 | Concatenacao de classes |
| tailwind-merge | 3.5 | Merge inteligente de classes Tailwind |

## Formularios

| Dependencia | Versao | Finalidade |
|---|---|---|
| React Hook Form | 7.71 | Gerenciamento de forms |
| Zod | 3.24 | Validacao de schemas |
| @hookform/resolvers | 5.2 | Integracao React Hook Form + Zod |

## Backend e Dados

| Dependencia | Versao | Finalidade |
|---|---|---|
| @supabase/supabase-js | 2.112 | Cliente Supabase (Auth, PostgREST, Storage, Realtime) |
| PostgreSQL | — | Banco de dados relacional com RLS |
| pg_cron | — | Tarefas agendadas no banco (expiracao de reservas) |

## Autenticacao

| Dependencia | Versao | Finalidade |
|---|---|---|
| Supabase Auth | — | Sessoes, JWT, auto-refresh |
| @lovable.dev/cloud-auth-js | 1.1 | Google OAuth via Lovable Cloud Auth |
| Email/Senha | — | Autenticacao basica via Supabase Auth |

## Pagamentos

| Dependencia | Versao | Finalidade |
|---|---|---|
| InfinityPay | — | Gateway PIX |
| Mercado Pago | — | Gateway PIX |
| PagBank | — | Gateway PIX |
| qrcode | 1.5 | Geracao de QR codes PIX |
| xlsx | 0.18.5 (SheetJS) | Exportacao de relatorios (CSV/Excel/JSON) |

## Build e Desenvolvimento

| Dependencia | Versao | Finalidade |
|---|---|---|
| Vite | 8.1 | Build tool e dev server |
| TypeScript | 5.8 | Tipagem estatica |
| Nitro | 3.0 | Runtime SSR (Cloudflare Workers) |
| ESLint | 9 | Linting |
| Prettier | 3.7 | Formatacao de codigo |
| eslint-config-prettier | 10.1 | Compatibilidade ESLint + Prettier |
| eslint-plugin-prettier | 5.2 | Prettier como regra ESLint |
| eslint-plugin-react-hooks | 5.2 | Regras de hooks React |
| eslint-plugin-react-refresh | 0.4 | Fast refresh |
| vite-tsconfig-paths | 6.0 | Resolucao de paths TypeScript no Vite |
| @vitejs/plugin-react | 5.2 | Plugin React para Vite |
| @tailwindcss/vite | 4.2 | Plugin Tailwind para Vite |
| @tanstack/router-plugin | 1.168 | Geracao automatica de rotas |

## Testes

| Dependencia | Versao | Finalidade |
|---|---|---|
| Vitest | 4.1 | Framework de testes |
| @testing-library/react | 16.3 | Testes de componentes React |
| @testing-library/jest-dom | 7.0 | Matchers DOM para testes |
| jsdom | 30.0 | Ambiente DOM para testes |

## Deploy

| Componente | Tecnologia |
|---|---|
| Plataforma | Lovable (https://lovable.dev) |
| Edge Runtime | Cloudflare Workers via Nitro |
| Branch de Deploy | main (auto-deploy ao push) |

## Utilitarios

| Dependencia | Versao | Finalidade |
|---|---|---|
| date-fns | 4.1 | Manipulacao de datas |
| globals | 15.15 | Variaveis globais ESLint |
