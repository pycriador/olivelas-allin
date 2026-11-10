# Product — Olivelas All In (`v2.0.0`)

<!-- impeccable:product-schema 2 -->

## Platform

Web (Desktop, Tablet & Mobile Responsive SaaS)

## Stack

React 19 + TypeScript 5.7 (strict) + Vite 6 + React Router 7 + Supabase PostgreSQL 17 (`public.profiles` + 27 Domain Schemas) + IndexedDB Local Sync + Multi-Instance SSO Server (`:4101`–`:4137`)

## Users

- **Super Administrador Global (`Willian Jesus <willian.o.jesus@gmail.com>`):** Conta única de administração global pré-cadastrada em todas as 37 plataformas comerciais e no Console Principal, com configuração de senha no primeiro acesso persistida diretamente no Supabase (`public.profiles` e `auth.users`).
- **Empresas Contratantes & Operadores (Multiempresa):** Organizações que contratam sob demanda qualquer combinação das **37 Plataformas Comerciais Olivelas** (e dos 10 módulos base), operando em instâncias isoladas com governança HBAC, faturamento unificado e auditoria forense.

## Product Purpose

**Olivelas All In** unifica o Console Central de Governança Multiempresa (`:5174`) com um ecossistema real de **37 Plataformas Comerciais** (`:4101` a `:4137`). Cada aplicação comercial conta com Single Sign-On (SSO) automático com sessão ativa persistente, URL limpa contendo apenas o nome da aplicação (`/<nome_da_aplicacao>`), identidade visual e Favicon SVG próprios (`/favicon.svg`), e uma barra inferior interativa que permite alternar entre as 3 camadas da aplicação:
1. **Landing Page** (Vitrine pública / apresentação comercial)
2. **Tela de Login (Visualização)** (Modo somente leitura e sem funcionalidade, mantendo a sessão SSO ativa)
3. **Administração (SSO)** (Painel administrativo autenticado com o Global Admin)

## Positioning

- **Ecossistema Completo de 37 Plataformas + 10 Módulos Base:** Abrange Saúde/Clínicas, Varejo/PDV/Delivery/Hortifruti, Imóveis/Condomínios, Engenharia/Jurídico/IA, Educação/Fitness, Marketing/Rifas/Afiliados, Infraestrutura/Túneis/Cloud Backup e **7 Páginas Estáticas** (frontend puro sem dependência de backend).
- **Sessão SSO Ativa & URLs Limpas:** Elimina URLs extensas com parâmetros de query string (`?allin_sso=1&instance_id=...`), mantendo a sessão autenticada via `localStorage` e cookies compartilhados e exibindo apenas `http://localhost:<porta>/<aplicacao>`.
- **Catálogo Unificado e Zero Scroll Horizontal:** Listagens consolidadas em tabela única sem rolagem horizontal, com detalhes em modal (`ModuleDetailsModal` fechável com `X`, `ESC` ou clique externo) e todas as ações agrupadas em menu dropdown (`ActionDropdownMenu`).

## Capabilities and Constraints

- **Administrador Global Único:** `willian.o.jesus@gmail.com` configurado como `GLOBAL_ADMIN` em todas as ferramentas e schemas.
- **Classificação de Página Estática (`isStaticPage: true`):** As 7 aplicações frontend-only (`:4129` a `:4135`) são identificadas como **Página Estática** em todas as listagens, modais e indicadores de instância.
- **Zero Dependências Legadas (Lovable Removido):** Todas as 37 aplicações possuem build local autônomo, títulos oficiais `Olivelas - <Aplicação>` e favicons SVG vetoriais exclusivos.
- **Zero Exclusão Física por Padrão:** Arquivamento lógico auditado com motivo, autor e carimbo de tempo em `public.allin_audit_events`.
- **Gerenciamento Simplificado via `./start`:** Inicialização (`./start` ou `./start start`), parada (`./start stop`), reinicialização (`./start restart`) e diagnóstico (`./start status`).
