---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/pages/public/LandingPage.tsx"]
---

# Surface Brief — Olivelas Allin (Operate & Persuade)

## Scope and Visitor Mode
- **Modes:** `operate` (Console Global `/app/global` e Ambiente da Empresa `/app/empresa/:empresaId`) e `persuade` (Landing Page `/`, Planos `/planos` e Autenticação `/login`).
- **Audience & Task:** Administradores da plataforma, gestores financeiros e equipes de pequenas empresas operando módulos contratados sob demanda com isolamento multiempresa, controle de acesso hierárquico (HBAC) e persistência local IndexedDB.

## Direction contract

- **THESIS:** O Olivelas Allin opera como um Atlas de Despacho e Registro Corporativo de alta precisão, recusando tanto o visual genérico de cartões flutuantes com gradientes artificiais quanto telas cinzentas sem hierarquia.
- **OWN-WORLD:** Superfície mineral estruturada (`#F8FAFC` / `#FFFFFF` no tema claro; `#0B0F19` / `#111827` no tema escuro), rail de comando azul-prussiano profundo (`#0F172A`), acento operacional cobalto (`#2563EB`) e sinalizador esmeralda-teal (`#0D9488`), bordas de `1px solid`, cantos contidos (`6px`–`8px`), tipografia `Inter` com numerais tabulares (`tabular-nums`) e `JetBrains Mono` exclusivamente para IDs, chaves, tokens e payloads HTTP.
- **STORY:** O visitante compreende imediatamente que pode contratar apenas os módulos necessários por empresa, governar permissões hierárquicas rastreáveis e auditar cada operação sem perda de dados históricos, testando na hora os 6 perfis do ecossistema.
- **FIRST VIEWPORT:** Na área pública (`/`), cabeçalho institucional com seletor PT-BR/EN/ES e tema, seguido de painel dividido em duas colunas assimétricas: à esquerda, título direto de governança modular com CTAs para Testar Perfis Mock e Explorar Catálogo; à direita, simulador interativo ao vivo de composição de módulos e matriz HBAC com cálculo imediato de contrato demonstrativo. Nos consoles (`/app/global` e `/app/empresa/:empresaId`), rail lateral compacto de `248px`, barra superior de contexto multiempresa/breadcrumbs/auditoria de suporte e grade operacional de indicadores reais calculados do IndexedDB e tabelas com filtros sincronizados na URL.
- **FORM:** Cartografia de Operações e Registro Notarial (Notarial Registry & Dispatch Atlas), posição #3 da lista fundamentada; `seed: none (unavailable)`.
- **FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
