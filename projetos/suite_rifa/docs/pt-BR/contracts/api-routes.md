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

# Rotas da API

> Language: pt-BR | [English](../../en/contracts/api-routes.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Finalidade

Rotas da API server-side executadas no Nitro (Cloudflare Workers). Essas rotas utilizam o cliente service_role do Supabase (bypassa RLS) e tratam operações que não podem ser realizadas a partir do cliente.

## Rotas

### POST /api/payments/create

Cria um pagamento via o provedor configurado. Atualmente em stub — retorna dados simulados de PIX.

| Campo | Valor |
| --- | --- |
| Método | POST |
| Auth | service_role (server-side) |
| Content-Type | application/json |

**Corpo da Requisição:**

```json
{
  "payment_id": "uuid"
}
```

**Processamento:**

1. Buscar pagamento por ID usando o cliente service_role
2. Buscar gateway associado e descriptografar credenciais
3. Chamar API do provedor (atualmente em stub — retorna dados mock de PIX)
4. Atualizar status do pagamento para PROCESSING
5. Armazenar `provider_payment_id` da resposta do provedor

**Resposta (200):**

```json
{
  "success": true,
  "provider_payment_id": "mock_123",
  "pix_qr_code": "base64...",
  "pix_copy_paste": "00020126..."
}
```

**Resposta de Erro (400/500):**

```json
{
  "error": "Payment not found"
}
```

**Implementação:**

```typescript
// server/api/payments/create.post.ts
export default defineEventHandler(async (event) => {
  const { payment_id } = await readBody(event);
  const supabase = supabaseAdmin;

  // Buscar pagamento
  const { data: payment } = await supabase
    .from("payments")
    .select("*, payment_gateways(*)")
    .eq("id", payment_id)
    .single();

  // Buscar e descriptografar credenciais do gateway
  const { data: gwRow } = await supabase
    .from("payment_gateways")
    .select("*")
    .eq("id", payment.gateway_id)
    .single();

  const { data: keyRow } = await supabase
    .rpc("get_app_setting" as never, { _key: "payment_encryption_key" } as never);

  const credentials = pgpDecrypt(gwRow.credentials_encrypted, keyRow as string);

  // Chamar provedor (stub)
  const result = await callProvider(gwRow.provider, credentials, payment);

  // Atualizar pagamento
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

Receptor de webhook para notificações do provedor de pagamento. Trata idempotência, mapeamento de status e confirmação automática.

| Campo | Valor |
| --- | --- |
| Método | POST |
| Auth | Nenhum (endpoint público, validado por assinatura do provedor) |
| Content-Type | application/json |
| Param | `provider` — um de: INFINITY_PAY, MERCADO_PAGO, PAGBANK |

**Processamento:**

1. Parse do corpo bruto como JSON
2. Extrair `provider_event_id` do payload (específico do provedor)
3. Registrar evento idempotentemente via `record_webhook_event()` (constraint UNIQUE impede duplicatas)
4. Encontrar pagamento por `provider_payment_id`
5. Mapear status do provedor para `payment_status` interno
6. Se status for CONFIRMED → chamar `confirm_payment()` (marca números SOLD, cria venda)
7. Se status for CANCELLED/FAILED → chamar `update_payment_status()`

**Mapeamento de Status (INFINITY_PAY):**

| Status do Provedor | Status Interno |
| --- | --- |
| `paid` | CONFIRMED |
| `pending` | PROCESSING |
| `cancelled` | CANCELLED |
| `refunded` | REFUNDED |

**Idempotência:**

```sql
-- record_webhook_event usa constraint UNIQUE
INSERT INTO webhook_events (provider, provider_event_id, payload)
VALUES ($provider, $event_id, $payload)
ON CONFLICT (provider, provider_event_id) DO NOTHING;
```

### GET /api/public/campaign-image

Proxy de imagens de campanha do Supabase Storage. Valida caminho para prevenir directory traversal.

| Campo | Valor |
| --- | --- |
| Método | GET |
| Auth | Nenhum (público) |
| Query Param | `path` — Caminho do Storage (deve começar com `organizations/`) |

**Segurança:**

- Caminho deve começar com `organizations/`
- Caminho não deve conter `..` (directory traversal bloqueado)
- Usa cliente service_role para acessar Storage

**Processamento:**

1. Validar que caminho começa com `organizations/` e não contém `..`
2. Baixar arquivo do Supabase Storage
3. Retornar arquivo com Content-Type apropriado

## Notas de Segurança

| Rota | Modelo de Confiança |
| --- | --- |
| `/api/payments/create` | Apenas server-side, usa service_role (bypassa RLS) |
| `/api/webhooks/:provider` | Público, mas idempotente e valida o provedor |
| `/api/public/campaign-image` | Público, caminho validado, serve apenas do prefixo `organizations/` |

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Funções RPC | [rpc-functions.md](rpc-functions.md) |
| Pagamentos | [../application/payments.md](../application/payments.md) |
| Segurança | [../security/overview.md](../security/overview.md) |
| Implantação | [../operations/deployment.md](../operations/deployment.md) |
