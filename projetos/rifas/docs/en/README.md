# RaffleHub Documentation

> Language: EN | [Portugues (pt-BR)](../pt-BR/README.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

RaffleHub is a SaaS platform for professional digital raffle management ("rifas digitais"). Full-stack web application built with React 19, TanStack Start, Supabase, and deployed via Lovable.

## Documentation Index

| Document | Description |
| --- | --- |
| [Project Overview](project-overview.md) | What RaffleHub is, who it serves, and its scope |
| [Architecture](architecture.md) | Technical architecture, data flow, and design patterns |
| [Technology Stack](stack.md) | Complete dependency inventory and technology choices |
| [Security](security.md) | Authentication, authorization, RLS, and LGPD compliance |
| [Database Schema](database.md) | Tables, enums, RPCs, and migration history |
| [Application Routes](routes.md) | All routes with access levels and descriptions |
| [Feature Catalog](features.md) | Comprehensive feature inventory |
| [Deployment](deployment.md) | How the application is built, deployed, and configured |

## Project Structure

```text
olivelas-raffle/
├── src/
│   ├── routes/           # TanStack Router file-based routes
│   ├── features/         # Feature modules (campaigns, payments, etc.)
│   ├── components/       # Shared UI components (shadcn/ui + custom)
│   ├── services/         # Client-side service modules (Supabase queries)
│   ├── lib/              # Server functions, permissions, utilities
│   ├── contexts/         # React contexts (auth, theme)
│   ├── types/            # TypeScript type definitions
│   ├── schemas/          # Zod validation schemas
│   ├── integrations/     # Supabase client/server setup, types
│   └── styles.css        # Global styles + Tailwind config
├── supabase/
│   ├── config.toml       # Supabase project configuration
│   └── migrations/       # SQL migrations (versioned, idempotent)
├── docs/                 # This documentation
└── public/               # Static assets
```
