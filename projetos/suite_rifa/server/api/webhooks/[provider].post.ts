import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PaymentGatewayProvider } from "@/services/types";

const VALID_PROVIDERS: PaymentGatewayProvider[] = ["INFINITY_PAY", "MERCADO_PAGO", "PAGBANK"];

export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, "provider")?.toUpperCase() as PaymentGatewayProvider | undefined;

  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid provider" });
  }

  const body = await readRawBody(event);
  if (!body) {
    throw createError({ statusCode: 400, statusMessage: "Empty body" });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    throw createError({ statusCode: 400, statusMessage: "Invalid JSON" });
  }

  // Extract provider-specific identifiers
  const eventId = String(
    payload.id ?? payload.event_id ?? payload.external_id ?? `wh_${Date.now()}`,
  );
  const eventType = String(
    payload.event ?? payload.type ?? payload.status ?? "unknown",
  );

  // Find matching payment by provider_payment_id
  const providerPaymentId = String(
    payload.data?.id ?? payload.payment_id ?? payload.external_reference ?? "",
  );

  if (!providerPaymentId) {
    return { ok: true, message: "No payment reference, skipped" };
  }

  const { data: payment, error: payErr } = await supabaseAdmin
    .from("payments")
    .select("id, organization_id, status, reservation_id, campaign_id")
    .eq("provider", provider)
    .eq("provider_payment_id", providerPaymentId)
    .single();

  if (payErr || !payment) {
    // Payment not found — return 200 to avoid provider retries
    return { ok: true, message: "Payment not found, skipped" };
  }

  // Record webhook event (idempotent via UNIQUE constraint)
  const { data: isNew } = await supabaseAdmin.rpc("record_webhook_event", {
    _organization: payment.organization_id,
    _payment: payment.id,
    _provider: provider,
    _event_id: eventId,
    _event_type: eventType,
    _payload: payload,
  });

  if (!isNew) {
    return { ok: true, message: "Duplicate event, skipped" };
  }

  // Map provider status to internal status
  const statusMap: Record<string, string> = {
    paid: "CONFIRMED",
    approved: "CONFIRMED",
    completed: "CONFIRMED",
    authorized: "CONFIRMED",
    pending: "PENDING",
    waiting: "PENDING",
    processing: "PROCESSING",
    cancelled: "CANCELLED",
    canceled: "CANCELLED",
    refused: "FAILED",
    failed: "FAILED",
    expired: "EXPIRED",
    refunded: "REFUNDED",
    chargeback: "REFUNDED",
  };

  const mappedStatus = statusMap[eventType.toLowerCase()] ?? null;

  if (mappedStatus && payment.status !== "CONFIRMED") {
    // Update payment status
    await supabaseAdmin.rpc("update_payment_status", {
      _payment: payment.id,
      _status: mappedStatus,
      _gateway_response: payload,
    });

    // If confirmed, create sale and mark numbers SOLD
    if (mappedStatus === "CONFIRMED") {
      await supabaseAdmin.rpc("confirm_payment", {
        _payment: payment.id,
      });
    }
  }

  return { ok: true };
});
