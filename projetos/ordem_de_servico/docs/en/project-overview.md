---
title: "ServiceForge Project Overview"
status: "ACCEPTED"
owner: "serviceforge-core"
updated: "2026-10-15"
---

# Project Overview — ServiceForge Platform

> Language: English (EN) | [Português (pt-BR)](../pt-BR/project-overview.md)
>
> Status: ACCEPTED | Version: v1.0.0-RC1

**ServiceForge** is a high-performance modular enterprise SaaS platform designed for end-to-end management of technical repair facilities, field service operations, and equipment maintenance providers.

---

## 🎯 Purpose

To streamline and optimize the entire technical assistance lifecycle: from customer reception and asset triage, diagnostics, quote authorization, and bench testing, through to inventory parts allocation, billing, delivery, and warranty tracking.

---

## 📋 Scope

| Module / Capability | Description | Status |
| :--- | :--- | :--- |
| **Service Orders (OS)** | Complete lifecycle tracking with 30+ operational tabs (diagnostics, parts, labor, checklists, timeline, signatures). | Completed (v1.0.0-RC1) |
| **Customers & Assets** | Unified Individual/Corporate entities, contacts, addresses, and serial-tracked equipment registry. | Completed (v1.0.0-RC1) |
| **Financial Management** | Accounts payable/receivable, bank accounts, cash flow, chart of accounts, and invoicing. | Completed (v1.0.0-RC1) |
| **Inventory & Purchasing** | Multi-warehouse support, stock bin locations, minimum levels, and supplier purchase orders. | Completed (v1.0.0-RC1) |
| **Human Resources & CRM** | Technical staff management, timesheets, commission calculations, and sales opportunities pipeline. | Completed (v1.0.0-RC1) |
| **Automation & Events** | Reactive domain event bus (45+ events) triggering automated workflows and state machines. | Completed (v1.0.0-RC1) |
| **Multi-Tenant Administration** | Multi-company tenancy, RBAC user permissions, and persistent audit logs. | Completed (v1.0.0-RC1) |
| **Responsive Theme Engine** | Full desktop/mobile layout responsiveness with dark/light modes and 6 curated color palettes. | Completed (v1.0.0-RC1) |

---

## 🚫 Non-Goals

| Non-Goal | Rationale |
| :--- | :--- |
| **Proprietary Payment Gateway** | ServiceForge integrates with third-party payment providers (Stripe, Mercado Pago) via connectors rather than handling banking settlements directly. |
| **Monolithic ERP Accounting Engine** | Heavy localized tax calculation and fiscal declarations are delegated to external accounting connectors. |
| **Plaintext Password Storage** | Authentication is strictly delegated to Supabase Auth using secure JWTs enforced by PostgreSQL Row Level Security. |
