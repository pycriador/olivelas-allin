# Data Canvas

# PROJETO

Criar uma plataforma SaaS moderna para administração de bancos de dados, construção de relatórios, dashboards e datasets corporativos.

O produto deverá unir recursos encontrados em ferramentas como:

- phpMyAdmin

- DBeaver

- Metabase

- Retool

- Airtable

- Power BI

Porém com foco em experiência corporativa, arquitetura API First e utilização do Lovable Cloud.

Não criar uma simples cópia dessas ferramentas.

A experiência deve ser moderna, intuitiva e orientada ao usuário de negócio.

====================================================================

STACK OBRIGATÓRIA

====================================================================

Utilizar exclusivamente tecnologias suportadas pelo Lovable Cloud.

Frontend

- React 19

- TypeScript

- Vite

- TanStack Router

- TanStack Query

- Tailwind CSS v4

- shadcn/ui

- Radix UI

- React Hook Form

- Zod

- Zustand

- Framer Motion

Backend

Utilizar Lovable Cloud.

Obrigatório utilizar:

- Lovable Auth

- Lovable PostgreSQL

- Lovable Storage

- Row Level Security (RLS)

- Migrations

- Edge Functions (preparar estrutura, mesmo que ainda não sejam utilizadas)

- Secrets para armazenamento seguro de credenciais futuras

====================================================================

MULTI-TENANT

====================================================================

Toda a aplicação deverá ser preparada desde o início para múltiplas organizações.

Criar conceito de:

Organização

Workspace

Projeto

Usuário

Grupo

Todas as tabelas devem possuir relacionamento com a organização.

Aplicar RLS desde o início.

====================================================================

AUTENTICAÇÃO

====================================================================

Implementar autenticação real.

Login

Cadastro

Esqueci minha senha

Troca de senha

Logout

Sessão persistente

Utilizar Lovable Auth.

Preparar suporte futuro para:

- Google

- Microsoft

- GitHub

====================================================================

TELA DE LOGIN

====================================================================

Visual moderno.

Tela dividida.

Lado esquerdo:

Descrição do produto.

Benefícios.

Imagem ilustrativa.

Lado direito:

Login.

Cadastro.

Recuperação de senha.

Alternância entre Login e Cadastro sem trocar de página.

====================================================================

LAYOUT

====================================================================

Criar layout Enterprise.

Sidebar recolhível.

Header.

Área central.

Footer discreto.

Tema claro.

Tema escuro.

Persistir preferência do usuário.

====================================================================

MENU

====================================================================

Nesta fase implementar apenas:

Home

Relatórios

Dashboards

Analytics

Favoritos

Administração

Perfil

Configurações

Ajuda

Ainda não implementar funcionalidades completas.

Criar toda navegação.

====================================================================

HOME

====================================================================

A Home NÃO deve parecer um administrador SQL.

Ela deverá parecer um portal corporativo.

Exibir:

Relatórios recentes.

Favoritos.

Dashboards.

KPIs simulados.

Atividades recentes.

====================================================================

DADOS DEMONSTRATIVOS

====================================================================

Criar seed automática.

Popular o banco com dados fictícios, porém realistas.

Criar pelo menos:

employees

departments

payroll

financial_transactions

users

groups

permissions

assets

Cada tabela deverá possuir pelo menos 30 registros.

Criar relacionamentos coerentes.

====================================================================

PERFIS

====================================================================

Criar estrutura RBAC.

Administrator

DBA

Developer

Analyst

User

Nesta fase apenas persistir os perfis.

As permissões detalhadas serão implementadas posteriormente.

====================================================================

CONFIGURAÇÕES

====================================================================

Criar tela de configurações.

Preparar seções:

Geral

Tema

Idioma

Notificações

IA (placeholder)

Integrações (placeholder)

Segurança (placeholder)

====================================================================

DESIGN SYSTEM

====================================================================

Criar identidade visual consistente.

Tipografia:

Inter

Componentes reutilizáveis.

Cards.

Modais.

Tabelas.

Badges.

Inputs.

Selects.

Command Palette.

Toast.

Skeletons.

Loading States.

Empty States.

====================================================================

INTERNACIONALIZAÇÃO

====================================================================

Implementar desde o início:

Português (Brasil)

English

Español

Toda interface deve utilizar arquivos de tradução.

Nenhum texto fixo nos componentes.

====================================================================

QUALIDADE

====================================================================

Código organizado.

Componentização.

Hooks reutilizáveis.

Validação com Zod.

Tipagem completa.

Sem código duplicado.

====================================================================

RESULTADO ESPERADO

====================================================================

Ao final desta fase deverá existir uma plataforma SaaS funcional utilizando Lovable Cloud, com autenticação real, arquitetura multi-tenant, layout enterprise, navegação completa, dados demonstrativos persistidos no PostgreSQL do Lovable Cloud, estrutura RBAC preparada e base sólida para evolução das próximas fases.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nexus-insight-hub-97.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d2b2a9a6-8e69-41b2-bacc-71d8870b8b29).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
