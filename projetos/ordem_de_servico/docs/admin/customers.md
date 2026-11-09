# Customer Management Module

The Customer Management module provides comprehensive tools for managing customer data within the ServiceForge platform.

## Features

- **Customer CRUD** — Create, read, update, and soft-delete customer records with full audit trail and version history.
- **Addresses & Contacts** — Manage multiple addresses (residential, commercial, delivery, billing) and contacts per customer.
- **Documents & Attachments** — Upload and organize customer documents and file attachments.
- **Observations** — Add internal observations with visibility control (public/private).
- **Communications** — Log communications across channels (email, WhatsApp, SMS, Telegram).
- **Relationships** — Link related customers (family, business, reference).
- **Timeline** — Automatic activity log for all customer interactions.
- **Duplicity Detection** — Find potential duplicate customers by CPF, CNPJ, email, or name similarity.
- **Import / Export** — Bulk import and export customer data.
- **Company Linking** — Share customers across multiple companies with linked-company support.
- **Customer Equipment** — Track equipment history and service orders per customer.
- **Warranties** — Manage warranties associated with customer equipment.

## Events

The module publishes events for all major operations, enabling integration with the Event Bus, workflows, and automation rules.

## Integration Points

- **Service Orders** — Customers are linked to service orders via `customerId`.
- **Demo Environment** — Demo scenarios generate realistic customer data for testing and presentations.
- **Translations** — Full i18n support with pt-BR, en, and es translations.
- **Dashboard** — Customer statistics include total, active, inactive, new this month, and per-company breakdowns.
