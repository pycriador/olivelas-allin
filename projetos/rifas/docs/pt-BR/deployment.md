---
title: "Deploy"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Deploy

> 🇧🇷 Language: Portugues do Brasil

## Plataforma

- **Plataforma de Deploy**: Lovable (https://lovable.dev)
- **Edge Runtime**: Cloudflare Workers via Nitro
- **Branch de Deploy**: `main` (deploy automatico ao push)

## URL de Producao

- **Aplicacao**: https://olivelas-raffle.lovable.app
- **Repositorio**: https://github.com/pycriador-org/olivelas-raffle

## Pipeline de Build

```
Fonte (TypeScript/React)
  → Vite 8 (build)
  → TanStack Router Plugin (geracao de rotas)
  → Nitro (bundling SSR)
  → Cloudflare Workers (deploy)
```

### Comandos

| Comando | Finalidade |
|---|---|
| `npm run dev` | Servidor de desenvolvimento local (Vite dev) |
| `npm run build` | Build de producao |
| `npm run build:dev` | Build em modo development |
| `npm run preview` | Preview do build local |
| `npm run lint` | Verificacao de codigo (ESLint) |
| `npm run format` | Formatacao de codigo (Prettier) |
| `npm run test` | Execucao de testes (Vitest) |

## Variaveis de Ambiente

### Supabase

| Variavel | Escopo | Descricao |
|---|---|---|
| `SUPABASE_URL` | Server | URL do projeto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Server/Client | Chave publica (anon/publishable) do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Chave de service-role (bypass RLS) |
| `VITE_SUPABASE_URL` | Client | URL do Supabase (via Vite env) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client | Chave publica do Supabase (via Vite env) |

### Aplicacao

| Variavel | Escopo | Descricao |
|---|---|---|
| `PUBLIC_SITE_URL` | Server | URL publica do site (fallback para webhook URLs) |
| `VITE_PUBLIC_SITE_URL` | Client | URL publica do site (via Vite env) |

### Gateways de Pagamento

Credenciais armazenadas no banco de dados (`payment_gateway_settings`), nao em variaveis de ambiente. Cada gateway possui:

- `credentials` (JSONB) — Chaves de API especificas do gateway
- `environment` — SANDBOX ou PRODUCTION
- `enabled` — Flag de habilitacao
- `pix_enabled` — Flag de PIX ativo

## Integracao Supabase

A integracao e gerenciada pela Lovable Cloud:

1. Conectar o projeto Supabase no painel Lovable
2. Variaveis de ambiente `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` sao configuradas automaticamente
3. `SUPABASE_SERVICE_ROLE_KEY` disponivel apenas no servidor

## Deploy Automatico

- Push na branch `main` dispara deploy automatico
- Build e executado via Vite → Nitro → Cloudflare Workers
- SSR roda no edge runtime (Cloudflare Workers)
- Rotas sao auto-geradas pelo `@tanstack/router-plugin`

## Estrutura de Diretorios Relevante

```
├── src/
│   ├── routes/          # File-based routes (rotas publicas + autenticadas)
│   ├── integrations/
│   │   └── supabase/    # Client + client.server + types
│   └── lib/
│       └── payments/    # Gateways (*.server.ts)
├── supabase/
│   └── migrations/      # Migracoes SQL do banco
├── vite.config.ts       # Configuracao Vite
└── nitro.config.ts      # Configuracao Nitro (SSR)
```

## Observacoes de Deploy

- O SSR e executado via Nitro no edge runtime (Cloudflare Workers)
- Apenas modulos `*.server.ts` sao executados no servidor — arquivos `client.ts` sao incluidos no bundle do cliente
- O `supabaseAdmin` (service-role) so e instanciado em modulos `*.server.ts` e nunca chega ao bundle do cliente
- Migracoes do banco devem ser aplicadas via CLI do Supabase (`supabase db push` ou `supabase migration up`) antes do deploy
- Webhooks de pagamento precisam de acesso HTTP direto a URL de producao
