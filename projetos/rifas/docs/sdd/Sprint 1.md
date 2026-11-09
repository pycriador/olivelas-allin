Sprint 1 — Foundation Platform
Objetivo

Você é um Engenheiro de Software Sênior especialista em React, TypeScript, arquitetura Frontend, UX Enterprise, PostgreSQL, Supabase/Lovable Cloud e sistemas SaaS escaláveis.

Desenvolva a primeira sprint do projeto abaixo.

Projeto

Criar uma plataforma SaaS chamada RaffleHub, destinada ao gerenciamento profissional de rifas digitais.

Nesta Sprint NÃO implementar regras de negócio das rifas.

O objetivo desta Sprint é construir toda a fundação da plataforma.

Stack obrigatória

Utilizar exclusivamente:

React 19
TypeScript
Vite
TanStack Router
TanStack Query
TailwindCSS v4
shadcn/ui
Radix UI
Framer Motion
React Hook Form
Zod
Lucide Icons

Backend

Lovable Cloud

Authentication
PostgreSQL
Storage
Edge Functions
Row Level Security

Não utilizar Next.js.

Não utilizar Prisma.

Toda persistência deverá utilizar Lovable Cloud.

Arquitetura

Separar rigorosamente o projeto em módulos.

Exemplo:

src/

components/

layouts/

pages/

hooks/

services/

contexts/

types/

schemas/

lib/

utils/

assets/

styles/

features/

modules/

Cada módulo deverá ser independente.

Evitar componentes gigantes.

Criar componentes reutilizáveis.

Não duplicar código.

Seguir SOLID.

Seguir Clean Architecture.

Design

Criar interface inspirada em

Stripe
Linear
Vercel
Notion
Airtable
Supabase

Visual minimalista.

Muito espaço em branco.

Animações suaves.

Bordas arredondadas.

Cards modernos.

Shadows discretas.

Interface premium.

Totalmente responsiva.

Desktop

Tablet

Mobile

Tema

Implementar Theme Provider.

Suportar

Light

Dark

Troca instantânea.

Persistir preferência do usuário.

Tipografia

Fonte

Inter

Hierarquia consistente.

Layout

Criar estrutura completa da aplicação.

Sidebar recolhível.

Topbar.

Área central.

Footer.

Breadcrumb.

Área para notificações.

Dialogs globais.

Loading global.

Página 404.

Página 500.

Login

Utilizar somente Google OAuth.

Fluxo

Usuário acessa

↓

Login Google

↓

Lovable Authentication

↓

Entrar

Primeiro usuário

Quando o primeiro usuário fizer login

Criar automaticamente

Global Admin

Todos os demais usuários

Role

User

Essa validação deverá ocorrer automaticamente.

Banco de Dados

Criar estrutura inicial.

Tabela

profiles

Campos

id

name

email

avatar_url

role

status

created_at

updated_at

last_login

Role

GLOBAL_ADMIN

USER

Status

ACTIVE

DISABLED

Row Level Security

Criar políticas completas.

Usuário comum

Somente visualiza seu próprio perfil.

Administrador Global

Visualiza todos.

Edita todos.

Desativa usuários.

Exclui usuários.

Sidebar

Itens

Dashboard

Campanhas

Usuários

Pagamentos

Configurações

Perfil

Somente Dashboard precisa existir nesta Sprint.

Os demais podem aparecer como

"Em desenvolvimento"

Dashboard

Criar dashboard administrativo.

Cards

Usuários

Campanhas

Receita

Pagamentos

Todos utilizando dados mockados temporariamente.

Depois serão ligados ao banco.

Criar gráficos utilizando componentes reutilizáveis.

Componentes

Criar biblioteca própria de componentes.

Button

Card

Input

Select

Badge

Avatar

Table

Pagination

Modal

Drawer

Alert

Empty State

Loading

Skeleton

Confirm Dialog

Toast

Todos reutilizáveis.

Configurações

Criar página.

Tema

Idioma

Perfil

Informações da plataforma

Sem lógica ainda.

Perfil

Tela

Editar nome

Avatar

Email somente leitura.

Tratamento de Erros

Criar Error Boundary.

Página de erro.

Fallback elegante.

Estados

Criar componentes para

Loading

Empty

Error

Unauthorized

Forbidden

Qualidade

Criar ESLint.

Prettier.

Aliases.

Separação por módulos.

Código fortemente tipado.

Nenhum uso de any.

Acessibilidade

Todos os componentes devem possuir

ARIA Labels

Navegação por teclado

Focus Ring

Contraste adequado

Performance

Lazy Loading

Code Splitting

Memoização quando necessário

TanStack Query

Suspense

Segurança

Google OAuth

Row Level Security

Proteção de rotas

Sessão persistente

Logout

Renovação automática da sessão

Auditoria

Preparar estrutura para logs.

Não implementar ainda.

Objetivo final da Sprint

Ao concluir esta Sprint, a aplicação deverá possuir:

Estrutura completa do projeto.
Arquitetura modular escalável.
Layout enterprise totalmente funcional.
Login Google integrado ao Lovable Cloud.
Criação automática do primeiro Global Admin.
CRUD básico do perfil do usuário autenticado.
Sidebar, Topbar e Dashboard funcionais.
Tema claro/escuro.
Componentes reutilizáveis.
Banco inicial configurado com RLS.
Base pronta para receber os módulos de Campanhas, Checkout, Pagamentos e Sorteios nas próximas sprints.
Critérios obrigatórios (Definition of Done)

Antes de considerar esta Sprint concluída, valide que:

Não existem erros de TypeScript.
Não existem erros de ESLint.
O projeto compila sem warnings críticos.
A interface é totalmente responsiva.
O login via Google está funcional.
O primeiro login cria automaticamente um usuário com papel GLOBAL_ADMIN.
Os demais usuários recebem o papel USER.
As políticas de RLS impedem acesso indevido.
Todos os componentes seguem o Design System criado.
Nenhum dado desta Sprint permanece mockado quando já existir integração equivalente com o Lovable Cloud.
O código está organizado para permitir evolução sem refatorações estruturais.
Minha sugestão para a Sprint 2

Em vez de partir diretamente para o módulo de rifas, faria primeiro a Platform Administration, criando toda a infraestrutura administrativa (CRUD de usuários, gerenciamento de permissões, configurações globais, auditoria e armazenamento de arquivos). Com isso, o restante do sistema passa a reutilizar uma base administrativa sólida, reduzindo bastante o retrabalho nas próximas fases.
