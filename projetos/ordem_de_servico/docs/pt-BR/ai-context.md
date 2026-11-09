---
title: "Contexto de IA e Navegação Progressiva"
status: "ACCEPTED"
owner: "serviceforge-core"
updated: "2026-10-15"
---

# Contexto de IA (ServiceForge Platform)

> Language: pt-BR | [English (EN)](../en/ai-context.md)
>
> Status: ACCEPTED | Versão: v1.0.0-RC1

**Ponto de entrada primário de IA** da plataforma ServiceForge. Agentes autônomos e desenvolvedores que configuram prompts devem iniciar aqui e seguir os links progressivos — sem carregar o repositório inteiro desnecessariamente.

---

## ⚡ Cadeia de Execução

```text
Contexto → Conhecimento → Relações → Evidência → Restrições → Ações
```

---

## 📊 Hierarquia de Níveis de Contexto (0–6)

| Nível | Foco | Carregar quando | Referência |
| :---: | :--- | :--- | :--- |
| **0** | Regras de navegação, limites de tarefas e segurança | Sempre no início de tarefas de IA | Este documento |
| **1** | Visão do sistema, propósito, módulos e glossário | Entender o escopo e domínio do produto | [project-overview.md](project-overview.md) |
| **2** | Arquitetura, componentes frontend e backend | Alterações estruturais, rotas e estado | [architecture/architecture.md](architecture/architecture.md) |
| **3** | Contratos de dados, tabelas PostgreSQL, schemas e APIs | Criação/edição de serviços, queries ou rotas | [contracts/contracts.md](contracts/contracts.md) |
| **4** | Operações, pipeline de build, scripts e deploys | Build, preview, GitHub Pages e deploy | [operations/operations.md](operations/operations.md) |
| **5** | Segurança, RLS, `security_invoker`, permissões e RBAC | Modificações em banco, views ou políticas | [security/security.md](security/security.md) |
| **6** | Testes e validação ponta a ponta (E2E) | Execução de testes e verificação de regressão | `scripts/test-e2e-real-db.mjs` |

---

## 🛡️ Restrições Críticas para Agentes

1. **Nunca reescrever histórico git publicado** (sem force push, rebase ou squash em commits já enviados ao Lovable/GitHub).
2. **Camada de Dados**: Toda operação de persistência deve ter fallback gracioso para cache local e sincronização reativa.
3. **Segurança de Views**: Toda view exposta no Supabase DEVE usar `with (security_invoker = on)`.
4. **Padrão de Tabelas**: Utilizar sempre o componente `DataTable` ou respeitar `overflow-x-auto min-w-0` e `first:pl-4 last:pr-4` para prevenir cortes laterais.
