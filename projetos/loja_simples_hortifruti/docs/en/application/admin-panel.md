---
id: "DOC-APP-ADMIN"
title: "Admin Management Panel"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Application"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Admin Management Panel

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/application/admin-panel.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Admin Management Panel

The admin management dashboard ([admin/index.html](../../../admin/index.html)) allows store administrators to manage the complete product catalog and inspect inventory stats.

## Admin Features

1. **Product Management (Full CRUD)**:
   - Add new products with image URLs, categories, regular & promotional prices, variations, and stock limits.
   - Edit existing items inline or via detailed form modal.
   - Delete products with confirmation guard.
2. **Availability & Stock Control**:
   - Update on-hand inventory levels (`estoque_atual`).
   - Toggle `Made to Order` (`sob_encomenda`) status with a single click.
   - Toggle `Featured` showcase status.
3. **JSON Backup & Import/Export**:
   - Immediate 1-click download of the active `produtos.json` file.
   - File upload interface to restore or batch-update catalog data.
4. **Dashboard Metrics**:
   - Total active products count.
   - Items on order vs. low stock vs. out of stock.
   - Average catalog item price.

See [../operations/catalog-maintenance.md](../operations/catalog-maintenance.md) for catalog backup and deployment procedures.
