---
title: "Feature Catalog"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Feature Catalog

> 🇧🇷 Language: English

## Campaign Management

- **4-Step Creation Wizard**: Guided campaign setup (basics → numbers → settings → publish)
- **7 Statuses**: DRAFT, SCHEDULED, ACTIVE, PAUSED, FINISHED, CANCELLED, ARCHIVED
- **Duplication**: Clone existing campaigns with all settings
- **Soft-Delete (Trash)**: Deleted campaigns move to trash before permanent removal
- **Featured/Pinned**: Highlight campaigns on the landing page
- **Visibility**: PUBLIC (listed on landing) or PRIVATE (direct link only)
- **Purchase Modes**: MANUAL (admin assigns) or AUTOMATIC (customer self-service)

## Number Grid

- **Virtualized Canvas Renderer**: High-performance rendering for campaigns with thousands of numbers
- **Selection Modes**: Click individual, drag-select range, QuickPick random selection
- **Real-Time Updates**: Supabase Realtime broadcasts keep all connected clients in sync
- **5 Visual Themes**: Light, Dark, Corporate, Minimal, Colorful
- **Artwork Generation**: Export grid as PNG/JPEG image with WhatsApp share

## Reservation System

- **Advisory Lock RPC**: PostgreSQL advisory locks prevent double-sell during concurrent reservations
- **Device Token Tracking**: Track reservation attempts per device
- **Auto-Expiration**: pg_cron releases expired reservations; client-side fallback timer as backup
- **Configurable Timeout**: Adjustable reservation window per campaign
- **Max Numbers Per Purchase**: Limit how many numbers a single transaction can contain

## Payments

- **PIX QR Code + Copy-Paste**: Generate QR code and pasteable PIX payload for customer payment
- **15-Minute Countdown**: Time-limited payment window with visual countdown
- **Multi-Gateway Support**: InfinityPay, Mercado Pago, PagBank — each independently configurable
- **Manual Payment**: Admin can record payments directly
- **Advanced Fee Mode ("Taxa Avançada")**: Custom fee structure for operators
- **Webhook Processing**: Gateway callbacks automatically confirm/reject payments
- **Idempotency**: Duplicate webhook payloads safely ignored via `payment_events` table
- **Reconciliation**: Admin tools to match gateway transactions with orders
- **Retry**: Failed payment attempts can be retried
- **Payment Ledger**: Complete payment history with status tracking

## Orders

- **Manual Sales**: Admin/Publisher creates orders directly
- **WhatsApp Orders**: Orders initiated via WhatsApp integration
- **Online Checkout**: Customer self-service checkout flow
- **Order Items**: Individual raffle numbers as line items
- **Receipts**: Post-payment confirmation receipts
- **CSV Import**: Bulk import pre-sold numbers
- **Status Transitions**: PENDING → CONFIRMED → PAID → SHIPPED → DELIVERED (+ CANCELLED, REFUNDED)

## Customer Management (CRM)

- **Customer CRUD**: Create, read, update, soft-delete customer records
- **Smart Search**: Search by name, phone, email, or city
- **Purchase History**: View all orders and payments per customer
- **Soft-Delete**: Customers hidden but retained for historical records
- **Quick-Create from Checkout**: New customers auto-created during online checkout

## Notifications

- **Event-Driven**: Triggered by ORDER_CREATED, PAYMENT_CONFIRMED, PAYMENT_REJECTED, etc.
- **WhatsApp + Email Channels**: Multi-channel delivery
- **Template Engine**: Customizable notification templates
- **Email Provider**: Resend for transactional email delivery

## Dashboard

- **Revenue KPIs**: Total revenue, average order value, conversion rates
- **Sales by Channel**: MANUAL, WHATSAPP, ONLINE breakdown
- **Financial Summary**: Income, fees, net revenue
- **Top Campaigns**: Best-performing campaigns by revenue and volume
- **Per-Campaign Metrics**: Individual campaign performance details

## Draw / Raffle

- **Fisher-Yates Algorithm**: Fair, unbiased random selection
- **Eligibility Checks**: Only paid/sold numbers enter the draw
- **Audited Results**: Full audit trail of draw execution
- **Configurable Winner Count**: Set how many winners per campaign

## Artwork Generation

- **Canvas-Based Renderer**: Generate number grid images from the campaign data
- **Modes**: Banner, Cover, No-Cover
- **Configurable Toggles**: Header, title, footer, legend, numbers, stats, paid/reserved/winner highlighting
- **Export Formats**: PNG and JPEG
- **WhatsApp Share**: One-tap share to WhatsApp

## Media Manager

- **Drag-and-Drop Upload**: Intuitive file upload interface
- **Type Badges**: COVER, GALLERY, SHARE, THUMBNAIL, BANNER classification
- **Alt/Caption Editing**: Accessibility metadata for images
- **Supabase Storage**: Files stored in Supabase Storage buckets

## Admin Console

- **User CRUD**: Create, edit, deactivate users; assign roles and status
- **Role × Permission Matrix**: Visual editor for 55 permissions across 3 roles
- **Platform Settings**: Global configuration key-value store
- **Payment Gateway Config**: Per-gateway credentials, environment (SANDBOX/PRODUCTION), enable/disable
- **Report Exports**: CSV, Excel (xlsx), JSON format exports
- **Audit Log Viewer**: Filter and review all state changes with actor, IP, timestamps

## SEO

- **Open Graph**: Campaign-specific OG meta tags
- **Twitter Card**: Twitter-optimized meta tags
- **JSON-LD**: Structured data for search engines
- **Canonical URLs**: Per-campaign canonical link tags

## LGPD Compliance

- **Data Masking**: Phone, email, and CPF masking helpers
- **Soft-Delete**: `deleted_at` column on campaigns and customers
- **Secret Hardening**: Credentials never committed in plaintext in migrations
- **Audit Trail**: Every state change logged with actor, IP, user agent, old/new values
