# ServiceForge

**Plataforma de Gestão de Assistência Técnica** — Modular SaaS para gestão de ordens de serviço, clientes, inventário, finanças e documentos.

> **Status:** MVP em desenvolvimento. Estrutura funcional com autenticação mock, persistência em localStorage e módulos placeholder prontos para implementação.

---

## Stack

| Camada               | Tecnologia                                                    |
| -------------------- | ------------------------------------------------------------- |
| Framework            | [TanStack Start](https://tanstack.com/start/latest) (SSR)     |
| UI                   | React 19, Tailwind CSS v4, shadcn/ui                          |
| Roteamento           | TanStack Router (file-based)                                  |
| Dados                | TanStack React Query                                          |
| Formulários          | React Hook Form + Zod                                         |
| Gráficos             | Recharts                                                      |
| Ícones               | Lucide React                                                  |
| Build                | Vite 8 + Bun                                                  |
| Deploy               | Nitro (Cloudflare por padrão)                                 |

## Funcionalidades

- **Dashboard** — Visão geral com empresa ativa, usuário, conexão e módulos carregados
- **Empresas** — Gerenciamento multi-empresa (CRUD, ativação, seed automático)
- **Conexões de Banco** — Gerenciamento de conexões (LocalStorage, Supabase, PostgreSQL, MariaDB, SQLite)
- **Configurações** — Tema (Light / Dark / System) e idioma (pt-BR, en, es)
- **Módulos** — 9 módulos planejados em categorias: Plataforma, Negócios e Administração
- **Internacionalização** — i18n completo com pt-BR, en, es
- **Sidebar responsiva** — Navegação colapsável com grupos

## Módulos

| Categoria   | Módulos                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| Plataforma  | Core, Metadados                                                          |
| Negócios    | Documentos, Comunicação, Registros, Ordens de Serviço, Financeiro, Estoque |
| Administração | Administração                                                          |

## Arquitetura

O projeto utiliza uma **arquitetura baseada em provedores** com abstração de persistência:

```
StorageProvider (interface)
├── LocalStorageProvider ✓
├── SupabaseProvider   ─ (futuro)
├── PostgreProvider    ─ (futuro)
└── ...
```

Autenticação, tema, i18n e armazenamento são providers plugáveis, permitindo troca sem alterar o código da aplicação.

## Desenvolvimento

```sh
bun install
bun run dev
```

## Scripts

| Comando              | Descrição                     |
| -------------------- | ----------------------------- |
| `bun run dev`        | Inicia servidor de desenvolvimento |
| `bun run build`      | Build de produção              |
| `bun run preview`    | Preview do build               |
| `bun run lint`       | ESLint                         |
| `bun run format`     | Prettier                       |

## Licença

Privado — todos os direitos reservados.
