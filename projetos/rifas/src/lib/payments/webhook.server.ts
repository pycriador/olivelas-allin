import {
  contextFromRow,
  createGatewayAdapter,
  loadGatewaySettings,
} from "./gateway-factory.server";
import { GatewayError, logPayment } from "./gateway.server";
import { processWebhookEvent } from "./payment.server";
import type { PaymentGateway } from "@/types/payment";
import { PAYMENT_GATEWAY_VALUES } from "@/types/payment";

const SLUG_TO_GATEWAY: Record<string, PaymentGateway> = {
  infinitypay: "INFINITYPAY",
  infinity_pay: "INFINITYPAY",
  mercadopago: "MERCADO_PAGO",
  mercado_pago: "MERCADO_PAGO",
  pagbank: "PAGBANK",
};

/** Converte o segmento da URL para o enum do gateway. */
export function parseGatewayParam(raw: string | undefined): PaymentGateway | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (SLUG_TO_GATEWAY[key]) return SLUG_TO_GATEWAY[key];
  const upper = raw.trim().toUpperCase() as PaymentGateway;
  if (PAYMENT_GATEWAY_VALUES.includes(upper)) return upper;
  return null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

/**
 * Handler HTTP unico para webhooks de todos os gateways.
 * - Valida assinatura via adapter
 * - Processa com idempotencia (payment_events)
 * - Sempre responde 2xx em duplicata para o provedor parar de reenviar
 */
export async function handlePaymentWebhookRequest(
  request: Request,
  gatewayParam: string | undefined,
): Promise<Response> {
  const gateway = parseGatewayParam(gatewayParam);
  if (!gateway) {
    logPayment("error", {
      event: "WEBHOOK_UNKNOWN_GATEWAY",
      detail: gatewayParam ?? null,
    });
    return json({ ok: false, error: "unknown_gateway" }, 404);
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400);
  }

  logPayment("info", {
    gateway,
    event: "WEBHOOK_RECEIVED",
    detail: { bytes: rawBody.length },
  });

  try {
    const settings = await loadGatewaySettings(gateway);
    if (!settings || !settings.enabled) {
      logPayment("error", { gateway, event: "WEBHOOK_GATEWAY_DISABLED" });
      return json({ ok: false, error: "gateway_disabled" }, 503);
    }

    const adapter = createGatewayAdapter(contextFromRow(settings));
    const event = await adapter.parseWebhook({
      headers: request.headers,
      rawBody,
    });

    if (!event) {
      logPayment("info", { gateway, event: "WEBHOOK_IGNORED", detail: "unparseable_or_empty" });
      // 200 evita retries infinitos em payloads que nao nos interessam
      return json({ ok: true, processed: false, reason: "ignored" });
    }

    const result = await processWebhookEvent(event, gateway);

    return json({
      ok: true,
      processed: result.processed,
      reason: result.reason ?? null,
    });
  } catch (error) {
    if (error instanceof GatewayError && error.code === "INVALID_SIGNATURE") {
      logPayment("error", { gateway, event: "WEBHOOK_INVALID_SIGNATURE" });
      return json({ ok: false, error: "invalid_signature" }, 401);
    }

    logPayment("error", {
      gateway,
      event: "WEBHOOK_HANDLER_ERROR",
      detail: error instanceof Error ? error.message : String(error),
    });

    // 500 para o provedor tentar de novo em falhas transitorias
    return json({ ok: false, error: "internal_error" }, 500);
  }
}
