---
title: "Documentação de Engenharia ServiceForge (pt-BR)"
status: "ACCEPTED"
owner: "serviceforge-core"
updated: "2026-10-15"
---

# Documentação ServiceForge Platform (pt-BR)

> Language: pt-BR | [English (EN)](../en/README.md)
>
> Status: ACCEPTED | Versão da Plataforma: v1.0.0-RC1

Bem-vindo à documentação oficial de engenharia da plataforma **ServiceForge**. Esta documentação segue o **Padrão de Documentação de Engenharia v1.0**, garantindo rastreabilidade, clareza arquitetural, integridade de contratos e contexto progressivo para desenvolvedores humanos e agentes de IA.

---

## 🧭 Índice Central

| Documento | Foco | Status |
| :--- | :--- | :--- |
| [Contexto de IA](ai-context.md) | Ponto de entrada de IA com hierarquia de níveis 0–6 | `ACCEPTED` |
| [Visão Geral do Projeto](project-overview.md) | Propósito, escopo, módulos e não-objetivos | `ACCEPTED` |
| [Arquitetura](architecture/architecture.md) | Diagramas C4, componentes, fluxo de dados e SSR/SPA | `ACCEPTED` |
| [Contratos](contracts/contracts.md) | Esquemas de banco PostgreSQL/Supabase, tipos e APIs | `ACCEPTED` |
| [Operações](operations/operations.md) | Build, desenvolvimento, deploy estático (GitHub Pages) e automação | `ACCEPTED` |
| [Segurança](security/security.md) | Políticas RLS, views seguras, RBAC e auditoria | `ACCEPTED` |

---

## 🚀 Início Rápido

```bash
# Instalação de dependências
npm install

# Execução em ambiente de desenvolvimento local (porta 8080)
npm run dev

# Validação e compilação de produção
npm run build

# Geração de pacote estático SPA para GitHub Pages
npm run build:gh-pages
```
