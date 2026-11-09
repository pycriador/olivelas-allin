# Asset Management Module

The Asset Management module provides comprehensive tools for managing equipment assets within the ServiceForge platform.

## Features

- **Asset CRUD** — Create, read, update, and soft-delete asset records with full audit trail and version history.
- **Equipment Types** — Define and manage equipment type categories.
- **Brands & Models** — Manage asset brands and models for standardized equipment classification.
- **Categories** — Organize assets into hierarchical categories.
- **Photos** — Upload and manage asset photos with categorization.
- **Accessories** — Track accessories associated with each asset.
- **Documents** — Attach and organize documents per asset.
- **Checklist** — Create and complete inspection checklists for assets.
- **Analytics** — Dashboard and analytics for asset utilization and status.
- **Import / Export** — Bulk import and export asset data.
- **History & Timeline** — Automatic activity log for all asset interactions.
- **Transfers** — Track asset transfers between locations, companies, and technicians.

## Events

The module publishes events for all major operations, enabling integration with the Event Bus, workflows, and automation rules.

## Integration Points

- **Service Orders** — Assets are linked to service orders via `equipmentId`.
- **Demo Environment** — Demo scenarios generate realistic asset data for testing and presentations.
- **Translations** — Full i18n support with pt-BR, en, and es translations.
- **Dashboard** — Asset statistics include total, by category, by status, and per-company breakdowns.
