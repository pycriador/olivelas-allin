# Olivelas - Cesta de Café - Admin

Quero criar uma aplicação SaaS chamada **Olivelas - Cestas de Café**.

O objetivo é ser uma plataforma para gerenciamento de produtos, estoque, financeiro e geração de catálogo em JSON para um montador de cestas de café da manhã.

Este projeto será desenvolvido no Lovable utilizando Lovable Cloud.

## Objetivos

O sistema deve ser simples, moderno e extremamente organizado.

Não quero um ERP genérico.

Quero um sistema focado em empresas que trabalham com montagem de cestas de café da manhã.

A prioridade é entregar uma primeira versão sólida, organizada e escalável.

Nunca adicionar módulos desnecessários.

Sempre priorizar simplicidade.

## Stack

Utilizar:

- React

- TypeScript

- Tailwind CSS

- shadcn/ui

- Supabase

- PostgreSQL

- Google OAuth

- Row Level Security (RLS)

Toda arquitetura deve seguir boas práticas.

Separar claramente:

- Interface

- Componentes

- Serviços

- Hooks

- Banco

- Tipagens

- Utilitários

Utilizar Clean Architecture sempre que possível.

## Layout

Criar duas aplicações dentro do mesmo projeto.

### 1 - Landing Page

Site comercial do produto.

Responsivo.

Moderno.

Com animações discretas.

Objetivo:

Apresentar o sistema.

Capturar clientes.

Mostrar benefícios.

Planos.

Contato.

Sem login obrigatório.

### 2 - Plataforma

Aplicação protegida por autenticação.

Dashboard administrativo.

Menu lateral.

Tema claro e escuro.

Responsiva.

Visual limpo.

Inspirado em:

- Stripe Dashboard

- Linear

- Vercel

- Supabase

Não copiar identidade visual.

Apenas seguir o mesmo nível de organização.

## Multiusuário

Autenticação via Google.

Quando um usuário fizer login pela primeira vez:

Ele NÃO pode acessar a plataforma.

Seu cadastro ficará como:

"Pendente de aprovação".

Somente um Administrador poderá:

- Aprovar

- Rejeitar

- Definir função

## Papéis

Criar apenas quatro papéis.

Administrador

Possui acesso completo.

Estoque

Gerencia produtos, estoque, lotes e movimentações.

Financeiro

Visualiza custos, compras, indicadores e relatórios financeiros.

Consulta

Somente leitura.

## Banco de Dados

Criar estrutura pensando em crescimento.

Entidades principais:

- Usuários

- Papéis

- Produtos

- Categorias

- Lotes

- Movimentações

- Compras

- Fornecedores

- Auditoria

- Logs

- Versões do Catálogo

Não criar dezenas de tabelas desnecessárias.

A estrutura deve permanecer simples.

## Auditoria

Toda alteração importante deve gerar registro.

Salvar:

- usuário

- data

- hora

- ação

- tabela

- registro alterado

- antes

- depois

Nada deve ser perdido.

## Logs

Registrar:

- login

- logout

- tentativa de acesso

- aprovação de usuários

- alterações importantes

- geração de catálogo

- download de catálogo

## Catálogo

O catálogo será armazenado no banco de dados.

Não editar arquivos JSON manualmente.

O sistema será o editor oficial.

O administrador poderá:

- cadastrar produtos

- editar produtos

- remover produtos

- alterar categorias

- alterar regras

- alterar preços

Quando desejar, poderá clicar em:

"Gerar Nova Versão"

O sistema criará uma nova versão do catálogo.

Cada versão deverá possuir:

- número da versão

- data

- usuário responsável

- observações da publicação

- status

Exemplo:

1.0.0

1.0.1

1.1.0

2.0.0

Cada versão poderá ser:

- visualizada

- comparada

- restaurada

- baixada

O download deverá gerar exatamente um arquivo JSON compatível com o montador de cestas.

A estrutura do JSON deve permanecer compatível com o formato utilizado atualmente.

Nunca quebrar compatibilidade.

## Qualidade

Toda tela deve possuir:

- loading

- tratamento de erro

- estados vazios

- validações

- feedback visual

## Organização

Gerar código limpo.

Componentes reutilizáveis.

Sem duplicação.

Sem código morto.

Sem funções gigantes.

Comentários apenas quando realmente necessários.

## Desenvolvimento

Não desenvolver todos os módulos de uma vez.

Primeiro criar apenas a fundação do projeto:

- autenticação

- layout

- navegação

- banco

- papéis

- permissões

- estrutura inicial

- landing page

- dashboard vazio

Depois iremos construir cada módulo separadamente.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://olivelas-cesta-cafe-admin.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1ecaf866-d870-401c-9a6d-14a7ebabbcd2).

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
