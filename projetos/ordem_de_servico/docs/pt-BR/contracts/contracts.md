---
title: "Contratos de Dados e APIs"
status: "ACCEPTED"
owner: "serviceforge-backend"
updated: "2026-10-15"
---

# Contratos de Dados e APIs — ServiceForge Platform

> Language: pt-BR | [English (EN)](../../en/contracts/contracts.md)
>
> Status: ACCEPTED | Versão: v1.0.0-RC1

Este documento define os contratos de entidades, modelos relacionais e estruturas de dados centrais utilizadas pelo ServiceForge no PostgreSQL / Supabase.

---

## 📋 Tabelas e Entidades Principais

| Tabela / Entidade | Propósito | Chave Primária | Principais Campos |
| :--- | :--- | :--- | :--- |
| `service_orders` | Ordens de Serviço | `id (UUID)` | `number, company_id, customer_id, equipment_id, description, status, priority, entry_date` |
| `customers` | Clientes (PF/PJ) | `id (UUID)` | `name, type, cpf, cnpj, email, phone, cellphone, whatsapp, status, addresses` |
| `equipment` | Ativos e Equipamentos | `id (UUID)` | `company_id, customer_id, brand_id, model, serial_number, status` |
| `fin_accounts` | Contas Financeiras Bancárias | `id (UUID)` | `company_id, name, bank, account_number, balance, status` |
| `fin_payable` | Contas a Pagar | `id (UUID)` | `company_id, description, supplier_id, amount, due_date, status` |
| `fin_receivable` | Contas a Receber | `id (UUID)` | `company_id, service_order_id, amount, due_date, status` |
| `inv_products` | Peças e Produtos | `id (UUID)` | `company_id, code, name, cost_price, sale_price, stock_quantity, min_stock` |
| `inv_movements` | Movimentações de Estoque | `id (UUID)` | `company_id, product_id, warehouse_id, type, quantity, date` |
| `hr_employees` | Colaboradores e Técnicos | `id (UUID)` | `company_id, name, email, phone, role_title, salary, commission_rate, active` |
| `companies` | Tenancies (Empresas) | `id (UUID)` | `legal_name, trade_name, cnpj, phone, email, active` |
| `audit_log` | Trilha de Auditoria | `id (UUID)` | `company_id, user_id, action, entity, entity_id, details, timestamp` |

---

## 🔒 Convenções de Integridade e Isolamento

1. **Schema Dedicado (`serviceforge`)**: Todas as 40 tabelas da aplicação residem exclusivamente no schema PostgreSQL `serviceforge`, prevenindo colisões ou misturas com outros projetos que compartilham a mesma instância Supabase.
2. **Exposição no PostgREST**: O PostgREST do Supabase está configurado com `pgrst.db_schemas = 'public, serviceforge'`. O cliente Supabase utiliza `{ db: { schema: 'serviceforge' } }` enviando os headers `Accept-Profile: serviceforge` e `Content-Profile: serviceforge`.
3. **Multi-tenancy obrigatório**: Todo registro operacional possui coluna `company_id` associada à organização ativa.
4. **Soft Deletes**: Deleções preservam integridade histórica populando `deleted_at (timestamptz)`.
5. **Formatação de Moeda**: Valores monetários são armazenados como `numeric(12,2)` para exatidão contábil.
