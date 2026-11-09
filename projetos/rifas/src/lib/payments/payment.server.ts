import {
  contextFromRow,
  createGatewayAdapter,
  loadGatewaySettings,
  resolveGatewayForCampaign,
} from "./gateway-factory.server";
import { GatewayError, logPayment, type GatewayWebhookEvent } from "./gateway.server";
import type { CheckoutOrderView, PaymentStatus, PaymentView } from "@/types/payment";
import type { Tables } from "@/integrations/supabase/types";

type PaymentRow = Tables<"payments">;

export function toPaymentView(row: PaymentRow): PaymentView {
  return {
    id: row.id,
    orderId: row.order_id,
    gateway: row.gateway,
    environment: row.environment,
    method: row.method,
    status: row.status,
    attemptNumber: row.attempt_number,
    amount: Number(row.amount),
    currency: row.currency,
    pixQrCode: row.pix_qr_code,
    pixCopyPaste: row.pix_copy_paste,
    expiresAt: row.expires_at,
    paidAt: row.paid_at,
    cancelledAt: row.cancelled_at,
    failureMessage: row.failure_message,
    createdAt: row.created_at,
  };
}

/** Monta a visão completa do checkout — somente dados públicos do pedido. */
export async function loadCheckoutOrder(orderId: string): Promise<CheckoutOrderView | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, status, campaign_id, customer_id, subtotal, discount, total, created_at, source")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!order) return null;

  const [campaignRes, itemsRes, customerRes, paymentsRes, numbersRes] = await Promise.all([
    supabaseAdmin
      .from("campaigns")
      .select("id, slug, title, product_name, cover_image, price_per_number")
      .eq("id", order.campaign_id)
      .maybeSingle(),
    supabaseAdmin
      .from("order_items")
      .select("number, unit_price")
      .eq("order_id", order.id)
      .order("number"),
    order.customer_id
      ? supabaseAdmin
          .from("customers")
          .select("full_name, phone, email")
          .eq("id", order.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabaseAdmin
      .from("payments")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("campaign_numbers")
      .select("reserved_until")
      .eq("purchase_id", order.id)
      .limit(1),
  ]);

  if (!campaignRes.data) return null;

  const items = itemsRes.data ?? [];
  const payments = (paymentsRes.data ?? []).map(toPaymentView);

  return {
    orderId: order.id,
    status: order.status,
    campaign: {
      id: campaignRes.data.id,
      slug: campaignRes.data.slug,
      title: campaignRes.data.title,
      productName: campaignRes.data.product_name,
      coverImage: campaignRes.data.cover_image,
      pricePerNumber: Number(campaignRes.data.price_per_number),
    },
    customer: customerRes.data
      ? {
          name: customerRes.data.full_name,
          phone: customerRes.data.phone,
          email: customerRes.data.email,
        }
      : null,
    numbers: items.map((item) => Number(item.number)),
    quantity: items.length,
    // Preço do pedido é congelado no momento da compra.
    unitPrice: Number(items[0]?.unit_price ?? campaignRes.data.price_per_number),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    reservedUntil: numbersRes.data?.[0]?.reserved_until ?? null,
    createdAt: order.created_at,
    payment:
      payments.find((payment) =>
        ["CREATED", "PENDING", "WAITING_PAYMENT"].includes(payment.status),
      ) ??
      payments.find((payment) => payment.status === "PAID") ??
      payments[0] ??
      null,
    payments,
  };
}

/**
 * Cria um pedido de checkout a partir de uma reserva existente.
 * Para campanhas AUTOMATIC: converte reserva temporaria em Order online.
 */
export async function createCheckoutOrder(input: {
  campaignId: string;
  token: string;
  reservedBy: string;
}): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: numbers, error: numError } = await supabaseAdmin
    .from("campaign_numbers")
    .select("number")
    .eq("campaign_id", input.campaignId)
    .eq("reservation_token", input.token)
    .eq("reserved_by", input.reservedBy)
    .eq("status", "RESERVED")
    .is("purchase_id", null);
  if (numError) throw numError;
  if (!numbers || numbers.length === 0) throw new Error("Reserva nao encontrada ou expirada.");

  const numberList = numbers.map((n) => Number(n.number));
  const { data: campaign } = await supabaseAdmin
    .from("campaigns")
    .select("price_per_number, reservation_timeout_minutes")
    .eq("id", input.campaignId)
    .maybeSingle();
  if (!campaign) throw new Error("Campanha nao encontrada");

  const quantity = numberList.length;
  const subtotal = quantity * Number(campaign.price_per_number);

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      campaign_id: input.campaignId,
      source: "ONLINE",
      status: "WAITING_PAYMENT",
      subtotal,
      discount: 0,
      total: subtotal,
      created_by: input.reservedBy,
    })
    .select("id")
    .single();
  if (orderError) throw orderError;

  await supabaseAdmin.from("order_items").insert(
    numberList.map((n) => ({
      order_id: order.id,
      campaign_id: input.campaignId,
      number: n,
      unit_price: campaign.price_per_number,
      status: "RESERVED",
    })),
  );

  const reservedUntil = new Date(
    Date.now() + (campaign.reservation_timeout_minutes || 15) * 60_000,
  ).toISOString();
  await supabaseAdmin
    .from("campaign_numbers")
    .update({
      purchase_id: order.id,
      reserved_until: reservedUntil,
      status: "PENDING_PAYMENT",
    })
    .eq("campaign_id", input.campaignId)
    .eq("reservation_token", input.token);

  return order.id;
}

/**
 * Cria uma NOVA tentativa de pagamento Pix. Tentativas anteriores nunca são
 * reutilizadas nem sobrescritas.
 */
export async function createPixPaymentForOrder(orderId: string): Promise<PaymentView> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, campaign_id, customer_id, status, total")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!order)
    throw new GatewayError("ORDER_NOT_FOUND", "Pedido não encontrado.", "Pedido não encontrado.");
  if (order.status !== "WAITING_PAYMENT" && order.status !== "OPEN") {
    throw new GatewayError(
      "ORDER_NOT_PAYABLE",
      `Pedido em status ${order.status}.`,
      "Este pedido não está mais aguardando pagamento.",
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .in("status", ["CREATED", "PENDING", "WAITING_PAYMENT"])
    .order("created_at", { ascending: false })
    .limit(1);

  const live = existing?.[0];
  if (live && (!live.expires_at || new Date(live.expires_at).getTime() > Date.now())) {
    return toPaymentView(live);
  }

  const [campaignRes, customerRes, countRes, numbersRes] = await Promise.all([
    supabaseAdmin
      .from("campaigns")
      .select("id, title, product_name, reservation_timeout_minutes")
      .eq("id", order.campaign_id)
      .maybeSingle(),
    order.customer_id
      ? supabaseAdmin
          .from("customers")
          .select("full_name, phone, email")
          .eq("id", order.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabaseAdmin
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId),
    supabaseAdmin.from("order_items").select("number").eq("order_id", orderId),
  ]);

  const campaign = campaignRes.data;
  if (!campaign) throw new GatewayError("CAMPAIGN_NOT_FOUND", "Campanha não encontrada.");

  // Revalida disponibilidade: nenhum número pode pertencer a outro pedido.
  const numbers = (numbersRes.data ?? []).map((item) => Number(item.number));
  const { data: conflicting } = await supabaseAdmin
    .from("campaign_numbers")
    .select("number, purchase_id, status")
    .eq("campaign_id", order.campaign_id)
    .in("number", numbers);
  const taken = (conflicting ?? []).filter(
    (row) => row.purchase_id !== orderId && (row.purchase_id !== null || row.status === "PAID"),
  );
  if (taken.length > 0) {
    throw new GatewayError(
      "NUMBERS_TAKEN",
      "Números indisponíveis.",
      `Não foi possível concluir a compra. Os seguintes números não estão mais disponíveis: ${taken
        .map((row) => row.number)
        .join(", ")}`,
    );
  }

  const settings = await resolveGatewayForCampaign(order.campaign_id);
  const adapter = createGatewayAdapter(contextFromRow(settings));
  const attemptNumber = (countRes.count ?? 0) + 1;
  const amount = Number(order.total);
  const idempotencyKey = `${orderId}:${attemptNumber}`;
  const expiresInMinutes = campaign.reservation_timeout_minutes;

  const { data: payment, error: insertError } = await supabaseAdmin
    .from("payments")
    .insert({
      order_id: orderId,
      campaign_id: order.campaign_id,
      customer_id: order.customer_id,
      gateway: settings.gateway,
      environment: settings.environment,
      method: "PIX",
      status: "CREATED",
      attempt_number: attemptNumber,
      amount,
      currency: "BRL",
      idempotency_key: idempotencyKey,
      expires_at: new Date(Date.now() + expiresInMinutes * 60_000).toISOString(),
    })
    .select("*")
    .single();
  if (insertError) throw insertError;

  logPayment("info", {
    gateway: settings.gateway,
    orderId,
    paymentId: payment.id,
    campaignId: order.campaign_id,
    customerId: order.customer_id ?? undefined,
    event: "PAYMENT_CREATED",
    status: "CREATED",
  });

  try {
    const result = await adapter.createPixPayment({
      idempotencyKey,
      orderId,
      paymentId: payment.id,
      amount,
      currency: "BRL",
      description: `${campaign.title} — ${numbers.length} número(s)`,
      expiresInMinutes,
      customer: {
        name: customerRes.data?.full_name ?? "Participante",
        phone: customerRes.data?.phone ?? "",
        email: customerRes.data?.email ?? null,
      },
    });

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        gateway_payment_id: result.gatewayPaymentId,
        gateway_order_id: result.gatewayOrderId,
        status: result.status,
        pix_copy_paste: result.pixCopyPaste,
        pix_qr_code: result.pixQrCodeImage,
        expires_at: result.expiresAt,
      })
      .eq("id", payment.id)
      .select("*")
      .single();
    if (updateError) throw updateError;

    logPayment("info", {
      gateway: settings.gateway,
      orderId,
      paymentId: payment.id,
      campaignId: order.campaign_id,
      event: "PIX_GENERATED",
      status: result.status,
    });

    return toPaymentView(updated);
  } catch (error) {
    const code = error instanceof GatewayError ? error.code : "UNKNOWN";
    await supabaseAdmin
      .from("payments")
      .update({
        status: "FAILED",
        failure_code: code,
        failure_message: "Não foi possível gerar o pagamento.",
      })
      .eq("id", payment.id);

    logPayment("error", {
      gateway: settings.gateway,
      orderId,
      paymentId: payment.id,
      campaignId: order.campaign_id,
      event: "PIX_GENERATION_FAILED",
      errorCode: code,
      detail: error instanceof Error ? error.message : String(error),
    });

    throw error instanceof GatewayError
      ? error
      : new GatewayError("UNKNOWN", "Falha inesperada ao criar pagamento.");
  }
}

/** Consulta o gateway e sincroniza o estado local (nunca confia no cliente). */
export async function syncPaymentStatus(paymentId: string): Promise<PaymentView | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return null;
  if (!["CREATED", "PENDING", "WAITING_PAYMENT"].includes(payment.status)) {
    return toPaymentView(payment);
  }

  if (payment.expires_at && new Date(payment.expires_at).getTime() <= Date.now()) {
    await applyPaymentOutcome(payment.id, "EXPIRED", null, "EXPIRED", "Pagamento expirado.");
    const { data: refreshed } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    return refreshed ? toPaymentView(refreshed) : null;
  }

  if (!payment.gateway_payment_id) return toPaymentView(payment);

  const settings = await loadGatewaySettings(payment.gateway);
  if (!settings) return toPaymentView(payment);

  try {
    const adapter = createGatewayAdapter(contextFromRow(settings));
    const result = await adapter.getPaymentStatus(payment.gateway_payment_id);
    if (result.status !== payment.status) {
      await applyPaymentOutcome(
        payment.id,
        result.status,
        result.paidAt,
        result.failureCode,
        result.failureMessage,
      );
    }
  } catch (error) {
    logPayment("error", {
      gateway: payment.gateway,
      orderId: payment.order_id,
      paymentId: payment.id,
      event: "STATUS_SYNC_FAILED",
      detail: error instanceof Error ? error.message : String(error),
    });
  }

  const { data: refreshed } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  return refreshed ? toPaymentView(refreshed) : null;
}

/** Aplica o desfecho de um pagamento usando as rotinas transacionais do banco. */
export async function applyPaymentOutcome(
  paymentId: string,
  status: PaymentStatus,
  paidAt: string | null,
  failureCode: string | null,
  failureMessage: string | null,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (status === "PAID") {
    const { error } = await supabaseAdmin.rpc("confirm_payment", {
      p_payment_id: paymentId,
      p_gateway_payment_id: "",
      p_paid_at: paidAt ?? new Date().toISOString(),
    });
    if (error) throw error;
    // Notificacao fire-and-forget — nunca bloqueia confirmacao
    void import("@/lib/notifications/service")
      .then((mod) => mod.notifyPaymentConfirmedByPaymentId(paymentId))
      .catch(() => undefined);
    return;
  }

  if (["FAILED", "CANCELLED", "EXPIRED", "REFUNDED"].includes(status)) {
    const { error } = await supabaseAdmin.rpc("finalize_payment", {
      p_payment_id: paymentId,
      p_status: status,
      p_failure_code: failureCode ?? "",
      p_failure_message: failureMessage ?? "",
    });
    if (error) throw error;
    return;
  }

  await supabaseAdmin.from("payments").update({ status }).eq("id", paymentId);
}

/**
 * Processa um evento de webhook de forma idempotente: o mesmo event_id nunca
 * é aplicado duas vezes.
 */
export async function processWebhookEvent(
  event: GatewayWebhookEvent,
  gateway: PaymentView["gateway"],
): Promise<{ processed: boolean; reason?: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("payment_events")
    .insert({
      gateway,
      event_id: event.eventId,
      event_type: event.eventType,
      status: event.status,
      payload: event.payload as never,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    // Violação de unicidade = evento repetido; nada a fazer.
    if (insertError.code === "23505") {
      logPayment("info", { gateway, event: "WEBHOOK_DUPLICATE", detail: event.eventId });
      return { processed: false, reason: "duplicate" };
    }
    throw insertError;
  }

  if (!event.gatewayPaymentId) {
    return { processed: false, reason: "no_payment_reference" };
  }

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id, status, order_id, campaign_id")
    .eq("gateway", gateway)
    .eq("gateway_payment_id", event.gatewayPaymentId)
    .maybeSingle();

  if (!payment) {
    await supabaseAdmin
      .from("payment_events")
      .update({ error_message: "Pagamento não encontrado." })
      .eq("id", inserted?.id ?? "");
    return { processed: false, reason: "payment_not_found" };
  }

  if (event.status && event.status !== payment.status) {
    await applyPaymentOutcome(payment.id, event.status, event.paidAt, null, null);
  }

  await supabaseAdmin
    .from("payment_events")
    .update({ processed: true, payment_id: payment.id })
    .eq("id", inserted?.id ?? "");

  logPayment("info", {
    gateway,
    orderId: payment.order_id,
    paymentId: payment.id,
    campaignId: payment.campaign_id,
    event: "WEBHOOK_PROCESSED",
    status: event.status ?? undefined,
  });

  return { processed: true };
}

/** Cancela o pedido e libera os números. */
export async function cancelCheckoutOrder(orderId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: payments } = await supabaseAdmin
    .from("payments")
    .select("id, status, gateway, gateway_payment_id")
    .eq("order_id", orderId)
    .in("status", ["CREATED", "PENDING", "WAITING_PAYMENT"]);

  for (const payment of payments ?? []) {
    if (payment.gateway_payment_id) {
      try {
        const settings = await loadGatewaySettings(payment.gateway);
        if (settings) {
          await createGatewayAdapter(contextFromRow(settings)).cancelPayment(
            payment.gateway_payment_id,
          );
        }
      } catch {
        // O cancelamento local prossegue mesmo se o gateway falhar.
      }
    }
    await applyPaymentOutcome(payment.id, "CANCELLED", null, "USER_CANCELLED", null);
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, campaign_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (order && !["PAID", "CANCELLED", "EXPIRED", "REFUNDED"].includes(order.status)) {
    await supabaseAdmin.from("campaign_numbers").delete().eq("purchase_id", orderId);
    await supabaseAdmin.from("orders").update({ status: "CANCELLED" }).eq("id", orderId);
  }
}
