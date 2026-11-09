# Olivelas Art Hub

Catálogo de artes autorais para canecas com catálogação automática por IA. Os clientes exploram coleções públicas e enviam pedidos direto pelo WhatsApp.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | TanStack Start (SSR) + React 19 |
| Estilo | TailwindCSS 4 + shadcn/ui (Radix) |
| Backend | Supabase (Auth, PostgREST, Storage, RLS) |
| IA | Lovable AI Gateway — Gemini 2.5 Flash (chat) + Gemini Embedding 2 |
| Animações | Framer Motion |
| Tipagem | TypeScript 5.8 + Zod |
| Build | Vite 8 + Nitro |

## Funcionalidades

- **Galeria pública** — listagem de coleções e artes com busca semântica (embeddings pgvector).
- **Painel admin** — dashboard, CRUD de coleções e artes, upload de imagens, configurações.
- **IA integrada** — geração automática de metadados (descrição, tags, cores, estilo, público-alvo, etc.), fila de processamento, histórico, prompts versionados.
- **WhatsApp** — mensagem pré-formatada com código da arte para pedido direto.
- **Autenticação** — login via Supabase Auth com controle de papéis (admin / user).

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) ou [Bun](https://bun.sh/)
- Conta no [Supabase](https://supabase.com/) com projeto ativo
- Chave `LOVABLE_API_KEY` (Lovable AI Gateway)

## Configuração

```bash
# Clonar
git clone <repo-url> && cd olivelas-art-hub

# Instalar dependências
npm install          # ou: bun install

# Variáveis de ambiente — copiar o .env já existente ou criar manualmente:
# SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_PROJECT_ID
# VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
# LOVABLE_API_KEY  (usado apenas no servidor)
```

## Desenvolvimento

```bash
npm run dev          # inicia o servidor de desenvolvimento
```

## Build e Preview

```bash
npm run build        # build de produção
npm run preview      # preview do build
```

## Outros Comandos

```bash
npm run lint         # ESLint
npm run format       # Prettier
```

## Estrutura do Projeto

```
src/
├── components/
│   ├── common/         # componentes reutilizáveis (image-uploader, data-table, etc.)
│   ├── layout/         # shell admin, sidebar, public shell
│   └── ui/             # shadcn/ui primitives
├── hooks/              # React hooks (auth, settings, file-upload, theme)
├── integrations/
│   └── supabase/       # client, auth-middleware, types
├── lib/
│   ├── ai/             # gateway, análise de artes, schema de metadados
│   ├── repositories/   # acesso a dados (artworks, collections, settings, ai)
│   ├── services/       # storage, slug, whatsapp
│   └── upload/         # store de importação
├── routes/
│   ├── index.tsx               # página pública inicial
│   ├── collections.*.tsx       # listagem e detalhe de coleções
│   ├── artworks.$id.tsx        # detalhe da arte (com link WhatsApp)
│   ├── auth.tsx                # login
│   └── _authenticated/
│       └── admin.*.tsx         # painel admin (dashboard, CRUD, IA, config)
├── styles.css
├── router.tsx
├── server.ts
└── start.ts
```

## Banco de Dados

Tabelas Supabase (todas com RLS):

| Tabela | Descrição |
| --- | --- |
| `collections` | Coleções de artes (nome, slug, imagens, ordem) |
| `artworks` | Artes (título, código, imagem, status) |
| `settings` | Configurações gerais (nome da empresa, WhatsApp) |
| `user_roles` | Papéis de usuário (admin, user) |
| `ai_settings` | Configurações de IA (modelo, idioma, temperatura) |
| `ai_prompts` | Prompts versionados para análise |
| `ai_prompt_versions` | Versões históricas dos prompts |
| `artwork_ai_metadata` | Metadados gerados pela IA por arte |
| `ai_processing_history` | Histórico de processamentos |
| `ai_queue` | Fila de processamento de IA |
| `artwork_embeddings` | Vetores de embedding (pgvector) |

## Segurança

- `LOVABLE_API_KEY` acessível apenas em server functions (nunca no cliente).
- Todas as rotas admin verificam `has_role('admin')` via RPC antes de operações privilegiadas.
- RLS no Supabase garante leitura pública apenas de metadados de artes ativas.
- Retry com backoff em erros 429/5xx; erro claro em 402 (créditos esgotados).
