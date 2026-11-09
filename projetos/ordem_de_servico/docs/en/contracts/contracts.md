---
title: "Data Contracts and APIs"
status: "ACCEPTED"
owner: "serviceforge-backend"
updated: "2026-10-15"
---

# Data Contracts and APIs — ServiceForge Platform

> Language: English (EN) | [Português (pt-BR)](../../pt-BR/contracts/contracts.md)
>
> Status: ACCEPTED | Version: v1.0.0-RC1

This document specifies the core schema contracts, entity structures, and relational models utilized across PostgreSQL / Supabase within the ServiceForge platform.

---

## 📋 Core Entity Contracts

| Table / Entity | Purpose | Primary Key | Key Attributes |
| :--- | :--- | :--- | :--- |
| `service_orders` | Service Orders (OS) | `id (UUID)` | `number, company_id, customer_id, equipment_id, description, status, priority, entry_date` |
| `customers` | Customers (Individual / Corporate) | `id (UUID)` | `name, type, cpf, cnpj, email, phone, cellphone, whatsapp, status, addresses` |
| `equipment` | Tracked Equipment Assets | `id (UUID)` | `company_id, customer_id, brand_id, model, serial_number, status` |
| `fin_accounts` | Bank Accounts | `id (UUID)` | `company_id, name, bank, account_number, balance, status` |
| `fin_payable` | Accounts Payable | `id (UUID)` | `company_id, description, supplier_id, amount, due_date, status` |
| `fin_receivable` | Accounts Receivable | `id (UUID)` | `company_id, service_order_id, amount, due_date, status` |
| `inv_products` | Inventory Items & Parts | `id (UUID)` | `company_id, code, name, cost_price, sale_price, stock_quantity, min_stock` |
| `inv_movements` | Stock Movements | `id (UUID)` | `company_id, product_id, warehouse_id, type, quantity, date` |
| `hr_employees` | Technicians and Staff | `id (UUID)` | `company_id, name, email, phone, role_title, salary, commission_rate, active` |
| `companies` | Tenancies (Organizations) | `id (UUID)` | `legal_name, trade_name, cnpj, phone, email, active` |
| `audit_log` | Security Audit Trail | `id (UUID)` | `company_id, user_id, action, entity, entity_id, details, timestamp` |

---

## 🔒 Contract Guarantees and Schema Isolation

1. **Dedicated Database Schema (`serviceforge`)**: All 40 application tables reside exclusively in the `serviceforge` PostgreSQL schema, completely isolating ServiceForge from other projects sharing the same Supabase database.
2. **PostgREST Multi-Schema Routing**: Supabase PostgREST exposes `pgrst.db_schemas = 'public, serviceforge'`. The client configures `{ db: { schema: 'serviceforge' } }` passing `Accept-Profile: serviceforge` and `Content-Profile: serviceforge` HTTP headers.
3. **Multi-Tenancy Enforcement**: Every core transactional entity possesses a mandatory `company_id` column mapped to tenant boundaries.
4. **Historical Integrity**: Soft-deletion via `deleted_at (timestamptz)` prevents orphaned foreign keys across operational tables.
5. **Monetary Precision**: All currency balances and line item prices are enforced as `numeric(12,2)` precision.
