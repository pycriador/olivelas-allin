# Changelog — ServiceForge Platform

## [1.0.0-RC1] — 2026-07-24

### Added
- **Foundation Platform**: Core architecture, providers, and utilities
- **Metadata Platform**: Entity, field, form, view, template, and dashboard metadata management
- **Master Data Platform**: Customers, devices, technicians, manufacturers, brands, models, categories, defects, services, parts, suppliers, payment methods, payment terms, warranties, measurement units
- **Document Platform**: Document generation, templates, signatures, QR codes
- **Communication Platform**: Email, SMS, WhatsApp, Telegram, push notifications, templates, scheduling
- **AI Platform**: OCR, Vision, Prompts, Queue, History, Audit, Playground, Conference
- **Workflow Engine**: Event-driven workflow execution with conditions, actions, and triggers
- **Core Event Bus**: Event publishing, subscribing, store, and history
- **Data Platform**: Database connections, queries, and data source management
- **Integration Platform**: Connectors, webhooks, sync engine, API management, health check
- **Administration Platform**: Users, roles, groups, policies, feature flags, themes, localization, providers, data sources, backup, env, secrets, monitoring, health, license, jobs, schedules, maintenance, impersonation
- **Service Orders**: Full lifecycle — creation, diagnosis, budget, approval, execution, parts, services, payment, delivery, warranty, return, closing
- **ERP**: Companies, departments, contracts, rules
- **HR**: Employees, timesheets, payroll, commissions, shifts
- **CRM**: Leads, opportunities, agreements, campaigns
- **Reporting & BI Platform**: Dashboards, widgets (18 types), reports, KPIs, datasets, templates, export engine, print engine, scheduler, history, audit
- **Automation Platform**: Workflow designer, business rules engine, state machine engine, approval engine, SLA engine, scheduler, job manager, timer manager, script engine, condition builder, variable manager, execution monitor, audit
- **Public Portal**: Public service order consultation, client portal, approval portal, document portal, file sharing, uploads, digital signatures, guarantee portal, downloads, timeline, branding (white-label), analytics, security, audit
- **Financial module**: Accounts payable/receivable, cost centers, invoices, transactions
- **Inventory module**: Products, warehouses, stock movements, stock counts, alerts, transfers
- **Purchasing module**: Purchase orders, receiving

### Changed
- All modules use consistent CRUD patterns via `makeService()` factory
- All modules integrate with Core Event Bus for cross-module communication
- All modules use Metadata Platform as the source of truth for fields and entities
- All modules consume Document Platform for document generation

### Security
- RBAC permissions across all modules
- Audit trails for all critical operations
- Protected public portal access with tokens and expiration
- Secure file upload/download with audit logging

### Notes
- ServiceForge Platform v1.0 Release Candidate 1
- Architecture ready for Financial, Inventory, Purchasing, CRM, and Scheduling modules
