---
title: "Database Schema"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Database Schema

> 🇧🇷 Language: English

## Tables

### profiles

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, FK → auth.users | 1:1 with auth.users |
| name | TEXT | NOT NULL | Display name |
| email | TEXT | NOT NULL | Email address |
| avatar_url | TEXT | | Profile image URL |
| status | profile_status | NOT NULL | ACTIVE, INACTIVE, SUSPENDED, PENDING, BANNED |
| role_id | UUID | FK → roles.id | Assigned role |
| plan_id | UUID | FK → plans.id | Current plan |

### roles

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| code | TEXT | UNIQUE, NOT NULL | GLOBAL_ADMIN, ADMIN, PUBLISHER |
| name | TEXT | NOT NULL | Human-readable name |
| is_system_role | BOOLEAN | NOT NULL | System roles cannot be deleted |

### plans

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| code | TEXT | UNIQUE, NOT NULL | FREE, STANDARD, PRO |
| max_campaigns | INTEGER | NOT NULL | Campaign creation limit |
| limits | JSONB | | Additional plan limits |

### campaigns

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| slug | TEXT | UNIQUE, NOT NULL | URL-friendly identifier |
| title | TEXT | NOT NULL | Campaign title |
| status | campaign_status | NOT NULL | 7 statuses |
| visibility | TEXT | NOT NULL | PUBLIC, PRIVATE |
| is_featured | BOOLEAN | NOT NULL | Featured on landing page |
| number_start | INTEGER | NOT NULL | First number in range |
| number_end | INTEGER | NOT NULL | Last number in range |
| price | NUMERIC | NOT NULL | Price per number |
| created_by | UUID | FK → profiles.id | Publisher who created |
| deleted_at | TIMESTAMPTZ | | Soft-delete timestamp |

### campaign_numbers

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| campaign_id | UUID | FK → campaigns.id, NOT NULL | Parent campaign |
| number | INTEGER | NOT NULL | The raffle number |
| status | campaign_number_status | NOT NULL | 7 statuses |
| reserved_by | UUID | FK → profiles.id | Who reserved/purchased |
| reserved_until | TIMESTAMPTZ | | Reservation expiry |
| order_id | UUID | FK → orders.id | Associated order |

### campaign_settings

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| campaign_id | UUID | FK → campaigns.id, UNIQUE | 1:1 with campaign |
| (display/payment/SEO settings) | JSONB | | Various configuration fields |

### campaign_images

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| campaign_id | UUID | FK → campaigns.id, NOT NULL | Parent campaign |
| storage_path | TEXT | NOT NULL | Path in Supabase Storage |
| image_type | campaign_image_type | NOT NULL | COVER, GALLERY, SHARE, THUMBNAIL, BANNER |
| dimensions | JSONB | | Width/height metadata |

### customers

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| full_name | TEXT | NOT NULL | Customer name |
| phone | TEXT | | Phone number |
| email | TEXT | | Email address |
| city | TEXT | | City of residence |
| deleted_at | TIMESTAMPTZ | | Soft-delete timestamp |

### orders

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| campaign_id | UUID | FK → campaigns.id, NOT NULL | Source campaign |
| customer_id | UUID | FK → customers.id | Associated customer |
| source | order_source | NOT NULL | MANUAL, WHATSAPP, ONLINE |
| status | order_status | NOT NULL | 7 statuses |
| total | NUMERIC | NOT NULL | Order total |

### order_items

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| order_id | UUID | FK → orders.id, NOT NULL | Parent order |
| number | INTEGER | NOT NULL | Raffle number purchased |
| unit_price | NUMERIC | NOT NULL | Price per number |
| status | TEXT | NOT NULL | Item status |

### payments

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| order_id | UUID | FK → orders.id, NOT NULL | Associated order |
| gateway | payment_gateway | NOT NULL | INFINITY_PAY, MERCADO_PAGO, PAGBANK, MANUAL, ADVANCED_FEE |
| status | payment_status | NOT NULL | 8 statuses |
| amount | NUMERIC | NOT NULL | Payment amount |
| pix_qr_code | TEXT | | Base64 PIX QR code |
| gateway_payment_id | TEXT | | Gateway transaction ID |

### payment_events

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| gateway | TEXT | NOT NULL | Gateway name |
| event_id | TEXT | NOT NULL | Gateway event ID |
| | | UNIQUE(gateway, event_id) | Idempotency constraint |

### payment_gateway_settings

| Column | Type | Constraints | Notes |
|---|---|---|---|
| gateway | TEXT | PK | Gateway identifier |
| credentials | JSONB | | Encrypted credentials |
| | | Service-role only | No anon/auth grants |

### audit_logs

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| actor_id | UUID | FK → profiles.id | User who performed action |
| action | TEXT | NOT NULL | Action performed |
| entity_type | TEXT | NOT NULL | Table/entity affected |
| entity_id | UUID | | Specific record ID |
| old_value | JSONB | | Previous state |
| new_value | JSONB | | New state |

### platform_settings

| Column | Type | Constraints | Notes |
|---|---|---|---|
| key | TEXT | PK | Setting key |
| value | TEXT | | Setting value |

### settings

| Column | Type | Constraints | Notes |
|---|---|---|---|
| category | TEXT | NOT NULL | Setting category |
| key | TEXT | NOT NULL | Setting key |
| value | JSONB | | Setting value |

## Enums

| Enum | Values | Count |
|---|---|---|
| `campaign_status` | DRAFT, SCHEDULED, ACTIVE, PAUSED, FINISHED, CANCELLED, ARCHIVED | 7 |
| `campaign_number_status` | AVAILABLE, RESERVED, SOLD, PENDING, CANCELLED, REFUNDED, WINNER | 7 |
| `campaign_image_type` | COVER, GALLERY, SHARE, THUMBNAIL, BANNER | 5 |
| `order_source` | MANUAL, WHATSAPP, ONLINE | 3 |
| `order_status` | PENDING, CONFIRMED, PAID, SHIPPED, DELIVERED, CANCELLED, REFUNDED | 7 |
| `payment_status` | PENDING, PROCESSING, APPROVED, REJECTED, CANCELLED, REFUNDED, EXPIRED, ERROR | 8 |
| `payment_gateway` | INFINITY_PAY, MERCADO_PAGO, PAGBANK, MANUAL, ADVANCED_FEE | 5 |
| `payment_method_type` | PIX, CREDIT, DEBIT, BOLETO | 4 |
| `profile_status` | ACTIVE, INACTIVE, SUSPENDED, PENDING, BANNED | 5 |

## Key RPCs

| RPC | Purpose | Notes |
|---|---|---|
| `reserve_campaign_numbers` | Reserve numbers for a campaign | Advisory lock, expiry, rate limit |
| `release_expired_campaign_reservations` | Free expired reservations | Called by pg_cron |
| `confirm_payment` | Confirm payment and allocate numbers | Updates order + numbers |
| `create_manual_order` | Create order from admin/Publisher | Manual sales |
| `create_whatsapp_order` | Create order from WhatsApp flow | WhatsApp integration |
| `import_sold_numbers` | Bulk import pre-sold numbers | CSV import |
| `admin_manage_number` | Admin number operations | Force reserve/release/sold |
| `get_reservation_count_by_device` | Rate limiting | Per-device reservation count |

## Migration Naming

Migrations follow the pattern: `YYYYMMDDHHMMSS_description.sql`

Example: `20260812230000_add_advanced_fee_payment.sql`

All migrations are idempotent using `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`.
