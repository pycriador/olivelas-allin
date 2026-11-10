---
id: "DOC-OPS-MAINT"
title: "Catalog Maintenance, Backup & Restore"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Operations"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Catalog Maintenance, Backup & Restore

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/operations/catalog-maintenance.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Catalog Maintenance, Backup & Restore

Store inventory and catalog entries can be updated either through the Admin Dashboard or via source code.

## Update Procedures

### Method 1: Via Admin Dashboard (Recommended for Non-Technical Operators)
1. Navigate to `admin/index.html`.
2. Add, update, or remove items, setting real-time prices and stock levels.
3. Click **Export JSON (Backup)** to download the updated `produtos.json`.
4. Overwrite `data/produtos.json` in the codebase and push changes to Git for canonical versioning.

### Method 2: Direct Codebase JSON Editing (For Developers)
1. Open `data/produtos.json` in your code editor.
2. Follow the schema defined in [../contracts/produtos-json-schema.md](../contracts/produtos-json-schema.md).
3. Save the file and clear browser `localStorage` to verify the clean initial load.

See [local-development.md](local-development.md) for local testing steps.
