---
title: "Modelo de Segurança, RLS e Permissões"
status: "ACCEPTED"
owner: "serviceforge-sec"
updated: "2026-10-15"
---

# Modelo de Segurança e Permissões — ServiceForge Platform

> Language: pt-BR | [English (EN)](../../en/security/security.md)
>
> Status: ACCEPTED | Versão: v1.0.0-RC1

A arquitetura de segurança do ServiceForge baseia-se no princípio de menor privilégio (*least privilege*), isolamento multi-tenant estrito e proteção em nível de linha no banco de dados.

---

## 🛡️ Pilares de Segurança

### 1. Row Level Security (RLS)
Todas as tabelas contendo dados de clientes, financeiro, ordens de serviço e estoque possuem RLS ativo (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- Operações de leitura (`SELECT`) e escrita (`INSERT`, `UPDATE`, `DELETE`) filtram obrigatoriamente por `company_id` validado pelo token JWT da sessão do usuário autenticado.

### 2. Views com `security_invoker = on`
Conforme as melhores práticas do PostgreSQL e Supabase Security Advisor, todas as views criadas no schema `public` devem invocar as permissões do usuário executor, evitando brechas de elevação de privilégio:

```sql
create or replace view public.serviceforge_hr_employees with (security_invoker = on) as
  select id, company_id, name, email, phone, role_title, salary, commission_rate, active, created_at, updated_at
  from hr_employees;
```

### 3. Autenticação e Sessões
- Autenticação gerenciada pelo Supabase Auth.
- Tokens JWT assinados com expiração controlada e refresh tokens rotativos.
- Suporte a múltiplos tenants por usuário através da tabela associativa `user_companies`.

### 4. Trilha de Auditoria Imutável (`audit_log`)
- Todas as ações críticas (criação de OS, aprovação de orçamento, baixa de pagamento, exclusão de registros) geram eventos append-only na tabela `audit_log`.
