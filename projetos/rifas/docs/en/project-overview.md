---
title: "Project Overview"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Project Overview

> 🇧🇷 Language: English

## Purpose

RaffleHub is a professional SaaS platform for digital raffle management ("rifas digitais") tailored for the Brazilian market. It provides operators with end-to-end campaign lifecycle management, real-time number selection, integrated payment processing via PIX, customer relationship management, and actionable dashboards — all within a secure, LGPD-compliant environment.

## Target Users

| Role | Description |
|---|---|
| **PUBLISHER** | Raffle operators who create and manage campaigns, track sales, and run draws |
| **ADMIN** | Operational administrators with broad platform access |
| **GLOBAL_ADMIN** | Full platform control including user management, gateway configuration, settings, and audit |

## Scope

### In Scope

- **Full Campaign Lifecycle**: Draft → Scheduled → Active → Finished with duplication, soft-delete (trash), and featured/pinned visibility
- **Number Grid**: Real-time, virtualized canvas renderer with click/drag/QuickPick selection and 5 visual themes
- **Reservation System**: Advisory-lock-based concurrent reservation with auto-expiration and rate limiting
- **Payment Processing**: PIX via multiple gateways (InfinityPay, Mercado Pago, PagBank), manual payment recording, Advanced Fee mode, webhook processing with idempotency
- **Order Management**: Manual sales, WhatsApp orders, online checkout, CSV import, order status transitions
- **Customer Management (CRM)**: Customer CRUD, smart search, purchase history, quick-create from checkout
- **Real-Time Dashboard**: Revenue KPIs, sales by channel, financial summary, top campaigns, per-campaign metrics
- **Notifications**: Event-driven templates across WhatsApp and Email channels
- **Admin Console**: User CRUD, role × permission matrix, platform settings, payment gateway configuration, report exports (CSV/Excel/JSON), audit log viewer
- **Artwork Generation**: Canvas-based grid image export (PNG/JPEG) with configurable toggles and WhatsApp share
- **SEO**: Open Graph, Twitter Card, JSON-LD, canonical URLs per campaign
- **LGPD Compliance**: Data masking, soft-delete, secret hardening, full audit trail
- **Draw/Raffle**: Fisher-Yates algorithm with eligibility checks and audited results

### Out of Scope

- Mobile native applications (iOS/Android)
- Internationalization (i18n) — UI is exclusively in Brazilian Portuguese
- Non-PIX payment methods (credit, debit, boleto are defined in enums but not enabled)

## Live URL

https://olivelas-raffle.lovable.app

## Repository

https://github.com/pycriador-org/olivelas-raffle

## Key Metrics

- **User Roles**: 3 (GLOBAL_ADMIN, ADMIN, PUBLISHER)
- **Global Permissions**: 55
- **Database Tables**: 17
- **Database RPCs**: 7+
- **Payment Gateways**: 3 active + manual
- **Campaign Statuses**: 7
