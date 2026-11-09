# ClauseForge Foundation

Prompt Inicial — Fundação do Projeto

ClauseForge

Enterprise Document Automation Platform

Você é um Engenheiro de Software Staff especialista em arquitetura Enterprise, UX, IAM, aplicações SaaS multi-tenant e plataformas Low-Code.

Seu objetivo é construir a fundação do ClauseForge.

O que é o ClauseForge

O ClauseForge não é um editor de documentos.

Também não é um gerador de PDFs.

O ClauseForge é uma plataforma de automação documental onde cada Projeto representa uma aplicação completa de geração de documentos.

O documento é apenas o resultado da execução de um projeto.

Todo o restante do desenvolvimento deve seguir essa premissa.

Stack obrigatória

Frontend

React 19

TypeScript

Vite

TanStack Router

TanStack Query

Zustand

React Hook Form

Zod

TailwindCSS v4

shadcn/ui

Radix UI

TipTap

Framer Motion

Backend

Lovable Cloud

Banco

PostgreSQL

Autenticação

Lovable Auth

Storage

Lovable Storage

Edge Functions

Lovable Functions

Nunca criar regras de negócio diretamente nos componentes React.

Arquitetura

Utilizar arquitetura modular.

src/

app/

components/

features/

modules/

repositories/

services/

hooks/

stores/

validators/

types/

constants/

utils/

layouts/

contexts/

providers/

schemas/

lib/

integrations/

Separar por domínio.

Nunca centralizar toda lógica em pages.

Organização

Criar módulos independentes.

IAM

Workspace

Projects

Data Sources

Variables

Builders

Rules

Executions

Documents

Libraries

Validation

Audit

Notifications

Settings

Connectors

Cada módulo deve ser independente.

Multi Tenant

A aplicação deve nascer preparada para múltiplas empresas.

Estrutura

Workspace

↓

Usuários

↓

Projetos

↓

Documentos

Nunca assumir apenas uma empresa.

Landing Page

Criar Landing Page moderna.

Inspirada em:

Linear

Vercel

Stripe

Notion

OpenAI

Seções

Hero

Recursos

Como funciona

Benefícios

Segurança

Integrações

Planos

FAQ

Contato

Footer

Adicionar animações leves.

Modo claro e escuro.

Navegação pública

Landing

Login

Sobre

Privacidade

Termos

Contato

Login

Criar tela exclusiva.

Autenticação via Google utilizando Lovable Auth.

Adicionar também login por Email/Senha.

Layout moderno.

Lado esquerdo

Ilustração.

Lado direito

Login.

Botões

Entrar com Google

Entrar com Email

Esqueci senha

Criar conta

Controle de acesso

Após login.

Carregar Workspace.

Usuário pertence a um Workspace.

IAM Enterprise

Criar estrutura completa.

Usuários

Nome

Email

Avatar

Cargo

Status

Idioma

Último acesso

MFA

Grupos

Administradores Globais

Administradores Workspace

Jurídico

Compliance

Financeiro

RH

Leitura

Roles

Super Admin

Workspace Admin

Manager

Editor

Reviewer

Viewer

Permissões

Granulares.

Exemplo

Workspace.*

Projects.*

Documents.*

Executions.*

Libraries.*

Users.*

Settings.*

Audit.*

Connectors.*

Validation.*

Utilizar RBAC.

Administrador Global

Criar conceito.

O Administrador Global administra toda plataforma.

Não pertence obrigatoriamente a um Workspace.

Pode:

Criar Workspaces

Excluir

Suspender

Administrar usuários

Auditoria Global

Configurações Globais

Workspace

Cada Workspace possui:

Nome

Logo

Domínio

Idioma

Timezone

Plano

Status

Configurações

Branding

Dashboard Global

Após login.

Mostrar:

Projetos

Execuções

Documentos

Usuários

Conectores

Alertas

Auditoria

Pendências

Tema

Implementar:

Claro

Escuro

System

Salvar preferência.

Layout

Criar layout Enterprise.

Sidebar recolhível.

Topbar.

Breadcrumb.

Pesquisa Global.

Área de Notificações.

Perfil.

Command Palette.

Pesquisa Global

CTRL + K

Pesquisar:

Projetos

Usuários

Documentos

Execuções

Configurações

Configurações Globais

Empresa

Branding

Tema

Idioma

Permissões

Conectores

Logs

Auditoria

Auditoria

Registrar:

Login

Logout

CRUD

Alterações

Permissões

Convites

Conectores

Configurações

Banco de Dados

Criar modelagem preparada para crescimento.

Entidades principais

Workspace

User

Role

Permission

Group

Project

ProjectVersion

DataSource

Variable

Builder

Rule

Execution

GeneratedDocument

Library

Clause

AuditLog

Connector

Notification

Settings

Credential

Segurança

Implementar:

RBAC

Políticas de acesso

Proteção de rotas

Sessão

Refresh Token

Criptografia das credenciais

Nunca expor secrets no frontend.

Conectores (somente arquitetura)

Criar módulo.

Ainda sem implementação.

Google Sheets

Google Docs

REST API

CSV

XLSX

JSON

Cada conector deve possuir interface.

connect()

authenticate()

validate()

read()

write()

disconnect()

Preparação para Credenciais

Criar arquitetura.

No futuro o usuário poderá:

Cadastrar uma credencial Google.

Enviar arquivo JSON da Service Account.

O sistema armazenará as credenciais de forma criptografada utilizando o banco do Lovable Cloud.

Essas credenciais poderão ser reutilizadas por múltiplos projetos.

Ainda não implementar a integração.

Criar apenas arquitetura.

Componentes Globais

Criar biblioteca.

Buttons

Inputs

Dialogs

Drawers

Toasts

Tables

Forms

Cards

Stats

Charts

Command

Search

Tree

Badges

Timeline

Activity

DataGrid

UX

Nunca utilizar:

alert()

confirm()

prompt()

Utilizar sempre componentes modernos.

Responsividade

Desktop

Tablet

Mobile

Qualidade

Implementar:

ESLint

Prettier

Arquitetura consistente

Lazy Loading

Code Splitting

TanStack Query

Error Boundaries

Loading States

Skeletons

Empty States

Error States

Dados iniciais

Criar automaticamente:

1 Workspace

"ClauseForge Demo"

1 Super Admin Global

1 Workspace Admin

2 usuários de demonstração

Todos autenticáveis.

Não implementar ainda

Nesta Sprint não desenvolver:

Projetos

Builder

Fluxo

Variáveis

Fontes de Dados

Execuções

Biblioteca de Cláusulas

Geração de documentos

PDF

Google Sheets

Google Docs

Criar apenas a fundação arquitetural e a estrutura de navegação desses módulos.

Critérios de aceite

A Sprint somente será considerada concluída quando:

A aplicação estiver integrada ao Lovable Cloud para autenticação, banco de dados e armazenamento.

A Landing Page estiver funcional e profissional.

O login com Google e Email/Senha estiver operacional.

A arquitetura multi-tenant estiver implementada.

O sistema de IAM (RBAC) estiver funcional com Administrador Global, Administrador de Workspace e demais papéis.

O layout Enterprise estiver completo, incluindo sidebar, topbar, pesquisa global e gerenciamento de tema.

A modelagem do banco estiver preparada para as próximas funcionalidades.

Os módulos principais existirem como estrutura navegável, mesmo sem regras de negócio implementadas.

A arquitetura estiver pronta para que as próximas sprints implementem Projetos, Fontes de Dados, Variáveis, Builder Visual, Fluxos, Execuções, Biblioteca Corporativa e Conectores sem necessidade de refatoração estrutural.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5a6c42c9-9d9a-4f75-9b94-35a2899fa080).

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
