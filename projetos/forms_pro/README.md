# Pro Forms Hub

IAM Pro Forms - Fase 1

Crie uma aplicação SaaS enterprise-grade moderna chamada "IAM Pro Forms" utilizando exclusivamente o Lovable Cloud.

O projeto deve ser construído como uma plataforma SaaS pronta para produção, inspirada em:

Typeform

Tally

Notion

Stripe

Linear

Vercel

Framer

Supabase

O objetivo desta Fase 1 é construir toda a fundação da plataforma.

O resultado deve parecer um SaaS premium moderno e global.

Lovable Cloud

Utilizar integralmente:

Lovable Cloud

Deploy automático

Preview Deployments

Environment Variables

Produção pronta para deploy

Estrutura preparada para integração futura com backend FastAPI

Não criar backend real nesta fase.

Implementar toda camada de dados utilizando:

Mock Services

Mock APIs

Fake Authentication

Fake Database

Toda arquitetura deve ser preparada para futura substituição por APIs reais.

Stack Obrigatória

Core

React 19+

Next.js 16+

TypeScript

UI

TailwindCSS

shadcn/ui

Radix UI

Framer Motion

Lucide Icons

Estado

Zustand

Data

TanStack Query

Tabelas

TanStack Table

Formulários

React Hook Form

Zod

Objetivo da Fase 1

Entregar:

Landing Page

Sistema de Login

Sistema de Registro

Recuperação de Senha

Dashboard Principal

Gestão de Usuários

Gestão de Grupos

Sistema RBAC

Gestão de Permissões

Perfil do Usuário

Configurações

Layout Completo

Internacionalização

Tema Claro e Escuro

Não criar ainda:

Builder de formulários

Respostas

Analytics avançado

Essas funcionalidades ficarão para as próximas fases.

Design System

Criar identidade visual premium.

Inspirar em:

Linear

Stripe

Vercel

Notion

Visual:

Moderno

Elegante

Minimalista

Enterprise

Responsivo

Implementar:

Glassmorphism leve

Bordas suaves

Sombras modernas

Skeleton loading

Empty states

Toasts modernas

Micro animações

Transições suaves

Tema

Implementar:

Light Mode

Dark Mode

Persistência

Detecção automática do sistema

Toggle no Header

Internacionalização

Implementar:

Português Brasil

Inglês

Espanhol

Criar:

Provider global

Persistência do idioma

URLs localizadas

Exemplos:

/pt-br/dashboard

/en/dashboard

/es/dashboard

Sistema de Autenticação

Criar frontend completo.

Implementar:

Login

Registro

Logout

Forgot Password

Reset Password

Criar Fake Authentication Service.

Usuários devem permanecer autenticados após refresh.

Preparar arquitetura para JWT futuro.

Sistema RBAC

Criar arquitetura completa.

Roles:

admin

manager

user

Permissões:

manage_users

manage_groups

manage_permissions

view_dashboard

create_forms

edit_forms

delete_forms

Criar:

Permission Guards

Route Guards

Menu dinâmico baseado em permissões

Usuários

Criar módulo completo.

Funcionalidades:

Listagem

Busca

Filtro

Paginação

Criar usuário

Editar usuário

Desativar usuário

Excluir usuário

Campos:

Nome

Email

Grupo

Status

Último acesso

Data de criação

Utilizar TanStack Table.

Grupos

Criar módulo completo.

Funcionalidades:

Criar grupo

Editar grupo

Desativar grupo

Excluir grupo

Associar usuários

Associar permissões

Permissões

Criar tela administrativa para:

Listar permissões

Associar permissões a grupos

Visualizar permissões por grupo

Dashboard Principal

Criar dashboard moderno.

Cards:

Total de Usuários

Usuários Ativos

Grupos

Permissões

Gráficos mockados:

Crescimento de usuários

Usuários por grupo

Utilizar componentes preparados para integração futura.

Layout Principal

Criar:

Sidebar recolhível

Header

Breadcrumbs

Global Search

Notifications

User Menu

Footer

Perfil do Usuário

Criar página:

/profile

Permitir:

Alterar nome

Alterar email

Alterar senha

Usar mocks.

Configurações

Criar página:

/settings

Permitir:

Idioma

Tema

Preferências

Rotas

Públicas:

/

/login

/register

/forgot-password

/reset-password

Privadas:

/dashboard

/users

/groups

/permissions

/profile

/settings

Estrutura

Organizar:

app

components

modules

stores

hooks

services

providers

layouts

i18n

types

utils

Mock Backend

Criar:

mockUsers

mockGroups

mockPermissions

Criar services desacoplados simulando APIs REST.

Utilizar Promise e delays simulados.

Qualidade

Gerar:

Código limpo

TypeScript fortemente tipado

Componentes reutilizáveis

Arquitetura escalável

Estrutura enterprise

Entrega Esperada

Gerar uma aplicação totalmente funcional contendo:

Landing Page moderna

Login e Registro

Sistema RBAC completo

Dashboard

Gestão de Usuários

Gestão de Grupos

Gestão de Permissões

Perfil

Configurações

Internacionalização

Tema Claro/Escuro

Mock Backend

Estrutura preparada para integração futura com FastAPI

Deploy Ready para Lovable Cloud

Toda a aplicação deve parecer um SaaS premium moderno pronto para escala enterprise.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://formfinity-cloud.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9f0ae27d-e87b-48df-b108-bf0d469b0acc).

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
