---
title: "API Routes"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
id: "CTR-002"
type: "contracts"
---

# API Routes

> Language: EN | [Português (pt-BR)](../../pt-BR/contracts/api-routes.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Purpose

Server-side API routes running on Nitro (Cloudflare Workers). These routes use the Supabase service_role client (bypasses RLS) and handle operations that cannot be done from the client.

## Routes

### POST /api/payments/create

Creates a payment via the configured provider. Currently stubbed — returns simulated PIX data.

| Field | Value |
| --- | --- |
| Method | POST |
| Auth | service_role (server-side) |
| Content-Type | application/json |

**Request Body:**

```json
{
  "payment_id": "uuid"
}
```

**Processing:**

1. Fetch payment by ID using service_role client
2. Fetch associated gateway and decrypt credentials
3. Call provider API (currently stubbed — returns mock PIX data)
4. Update payment status to PROCESSING
5. Store `provider_payment_id` from provider response

**Response (200):**

```json
{
  "success": true,
  "provider_payment_id": "mock_123",
  "pix_qr_code": "base64...",
  "pix_copy_paste": "00020126..."
}
```

**Error Response (400/500):**

```json
{
  "error": "Payment not found"
}
```

**Implementation:**

```typescript
// server/api/payments/create.post.ts
export default defineEventHandler(async (event) => {
  const { payment_id } = await readBody(event);
  const supabase = supabaseAdmin;

  // Fetch payment
  const { data: payment } = await supabase
    .from("payments")
    .select("*, payment_gateways(*)")
    .eq("id", payment_id)
    .single();

  // Fetch and decrypt gateway credentials
  const { data: gwRow } = await supabase
    .from("payment_gateways")
    .select("*")
    .eq("id", payment.gateway_id)
    .single();

  const { data: keyRow } = await supabase
    .rpc("get_app_setting" as never, { _key: "payment_encryption_key" } as never);

  const credentials = pgpDecrypt(gwRow.credentials_encrypted, keyRow as string);

  // Call provider (stubbed)
  const result = await callProvider(gwRow.provider, credentials, payment);

  // Update payment
  await supabase.rpc("update_payment_status" as never, {
    _payment_id: payment_id,
    _new_status: "PROCESSING",
    _provider_payment_id: result.provider_payment_id,
    _pix_qr_code: result.pix_qr_code,
    _pix_copy_paste: result.pix_copy_paste,
  } as never);

  return { success: true, ...result };
});
```

### POST /api/webhooks/:provider

Webhook receiver for payment provider notifications. Handles idempotency, status mapping, and auto-confirmation.

| Field | Value |
| --- | --- |
| Method | POST |
| Auth | None (public endpoint, validated by provider signature) |
| Content-Type | application/json |
| Param | `provider` — one of: INFINITY_PAY, MERCADO_PAGO, PAGBANK |

**Processing:**

1. Parse raw body as JSON
2. Extract `provider_event_id` from payload (provider-specific)
3. Record event idempotently via `record_webhook_event()` (UNIQUE constraint prevents duplicates)
4. Find payment by `provider_payment_id`
5. Map provider status to internal `payment_status`
6. If status is CONFIRMED → call `confirm_payment()` (marks numbers SOLD, creates sale)
7. If status is CANCELLED/FAILED → call `update_payment_status()`

**Status Mapping (INFINITY_PAY):**

| Provider Status | Internal Status |
| --- | --- |
| `paid` | CONFIRMED |
| `pending` | PROCESSING |
| `cancelled` | CANCELLED |
| `refunded` | REFUNDED |

**Idempotency:**

```sql
-- record_webhook_event uses UNIQUE constraint
INSERT INTO webhook_events (provider, provider_event_id, payload)
VALUES ($provider, $event_id, $payload)
ON CONFLICT (provider, provider_event_id) DO NOTHING;
```

### GET /api/public/campaign-image

Proxies campaign images from Supabase Storage. Validates path to prevent directory traversal.

| Field | Value |
| --- | --- |
| Method | GET |
| Auth | None (public) |
| Query Param | `path` — Storage path (must start with `organizations/`) |

**Security:**

- Path must start with `organizations/`
- Path must not contain `..` (directory traversal blocked)
- Uses service_role client to access Storage

**Processing:**

1. Validate path starts with `organizations/` and contains no `..`
2. Download file from Supabase Storage
3. Return file with appropriate Content-Type

## Security Notes

| Route | Trust Model |
| --- | --- |
| `/api/payments/create` | Server-side only, uses service_role (bypasses RLS) |
| `/api/webhooks/:provider` | Public, but idempotent and validates provider |
| `/api/public/campaign-image` | Public, path-validated, serves only from `organizations/` prefix |

## Related Documentation

| Document | Path |
| --- | --- |
| RPC functions | [rpc-functions.md](rpc-functions.md) |
| Payments | [../application/payments.md](../application/payments.md) |
| Security | [../security/overview.md](../security/overview.md) |
| Deployment | [../operations/deployment.md](../operations/deployment.md) |
