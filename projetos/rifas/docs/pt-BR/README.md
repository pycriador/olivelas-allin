# Documentacao RaffleHub

> Language: [English](../en/README.md) | Portugues (pt-BR)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

RaffleHub e uma plataforma SaaS para gestao profissional de rifas digitais. Aplicacao web full-stack construida com React 19, TanStack Start, Supabase e hospedada via Lovable.

## Indice da Documentacao

| Documento | Descricao |
| --- | --- |
| [Visao Geral do Projeto](project-overview.md) | O que e o RaffleHub, para quem serve e seu escopo |
| [Arquitetura](architecture.md) | Arquitetura tecnica, fluxo de dados e padroes de design |
| [Stack Tecnologica](stack.md) | Inventario completo de dependencias e escolhas tecnologicas |
| [Seguranca](security.md) | Autenticacao, autorizacao, RLS e conformidade LGPD |
| [Schema do Banco](database.md) | Tabelas, enums, RPCs e historico de migracoes |
| [Rotas da Aplicacao](routes.md) | Todas as rotas com niveis de acesso e descricoes |
| [Catalogo de Features](features.md) | Inventario completo de funcionalidades |
| [Deploy](deployment.md) | Como a aplicacao e compilada, publicada e configurada |

## Estrutura do Projeto

```text
olivelas-raffle/
├── src/
│   ├── routes/           # Rotas file-based (TanStack Router)
│   ├── features/         # Modulos de feature (campanhas, pagamentos, etc.)
│   ├── components/       # Componentes UI compartilhados (shadcn/ui + custom)
│   ├── services/         # Modulos de servico client (queries Supabase)
│   ├── lib/              # Server functions, permissoes, utilitarios
│   ├── contexts/         # React contexts (auth, theme)
│   ├── types/            # Definicoes de tipos TypeScript
│   ├── schemas/          # Schemas de validacao Zod
│   ├── integrations/     # Setup Supabase client/server, types
│   └── styles.css        # Estilos globais + config Tailwind
├── supabase/
│   ├── config.toml       # Configuracao do projeto Supabase
│   └── migrations/       # Migracoes SQL (versionadas, idempotentes)
├── docs/                 # Esta documentacao
└── public/               # Assets estaticos
```
