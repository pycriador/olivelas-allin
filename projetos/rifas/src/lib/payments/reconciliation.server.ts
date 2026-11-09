import {
  contextFromRow,
  createGatewayAdapter,
  loadGatewaySettings,
} from "./gateway-factory.server";
import { logPayment } from "./gateway.server";
import {
  applyPaymentOutcome,
  createPixPaymentForOrder,
  syncPaymentStatus,
  toPaymentView,
} from "./payment.server";
import type { Tables } from "@/integrations/supabase/types";
import type {
  PaymentGateway,
  PaymentLedgerKind,
  PaymentStatus,
  PaymentView,
} from "@/types/payment";

type LedgerRow = Omit<Tables<"admin_payment_ledger">, "id" | "order_id" | "campaign_id" | "created_at"> & {
  id: string;
  order_id: string;
  campaign_id: string;
  created_at: string;
};
type PaymentRow = Tables<"payments">;

export type ReconciliationOutcome =
  | "UNCHANGED"
  | "UPDATED"
  | "EXPIRED_LOCAL"
  | "GATEWAY_PAID"
  | "GATEWAY_FAILED"
  | "REVIEW_REQUIRED"
  | "SKIPPED"
  | "ERROR";

export interface ReconciliationResult {
  paymentId: string;
  orderId: string;
  outcome: ReconciliationOutcome;
  previousStatus: PaymentStatus;
  nextStatus: PaymentStatus | null;
  message: string;
}

export interface PaymentTimelineItem {
  at: string;
  type: string;
  label: string;
  detail?: string | null;
  status?: string | null;
}

export interface PaymentAdminDetail {
  payment: PaymentView & {
    gatewayPaymentId: string | null;
    gatewayOrderId: string | null;
    failureCode: string | null;
    orderId: string;
    campaignId: string;
    customerId: string | null;
    kind: PaymentLedgerKind;
  };
  order: {
    id: string;
    status: string;
    total: number;
    source: string;
    createdAt: string;
  } | null;
  campaign: { id: string; title: string; slug: string } | null;
  customer: { name: string; phone: string; email: string | null } | null;
  numbers: number[];
  events: Array<{
    id: string;
    eventId: string;
    eventType: string;
    status: string | null;
    processed: boolean;
    errorMessage: string | null;
    createdAt: string;
  }>;
  timeline: PaymentTimelineItem[];
  attempts: PaymentView[];
}

/**
 * Reconcilia um pagamento individual com o gateway.
 * Nunca marca PAID sozinho sem confirmacao do gateway / RPC confirm_payment.
 */
export async function reconcilePayment(paymentId: string): Promise<ReconciliationResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: payment, error } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw error;
  if (!payment) {
    return {
      paymentId,
      orderId: "",
      outcome: "ERROR",
      previousStatus: "FAILED",
      nextStatus: null,
      message: "Pagamento nao encontrado",
    };
  }

  const previousStatus = payment.status as PaymentStatus;

  if (["PAID", "REFUNDED"].includes(payment.status)) {
    return {
      paymentId,
      orderId: payment.order_id,
      outcome: "SKIPPED",
      previousStatus,
      nextStatus: previousStatus,
      message: "Pagamento ja finalizado",
    };
  }

  // Expiracao local se passou do prazo e ainda aberto
  if (
    ["CREATED", "PENDING", "WAITING_PAYMENT"].includes(payment.status) &&
    payment.expires_at &&
    new Date(payment.expires_at).getTime() <= Date.now()
  ) {
    // Antes de expirar, tenta consultar o gateway (race: pago no limite)
    if (payment.gateway_payment_id) {
      try {
        const settings = await loadGatewaySettings(payment.gateway);
        if (settings) {
          const adapter = createGatewayAdapter(contextFromRow(settings));
          const remote = await adapter.getPaymentStatus(payment.gateway_payment_id);
          if (remote.status === "PAID") {
            await applyPaymentOutcome(payment.id, "PAID", remote.paidAt, null, null);
            return {
              paymentId,
              orderId: payment.order_id,
              outcome: "GATEWAY_PAID",
              previousStatus,
              nextStatus: "PAID",
              message: "Gateway confirmou PAID antes da expiracao local",
            };
          }
        }
      } catch (err) {
        logPayment("error", {
          gateway: payment.gateway,
          paymentId: payment.id,
          orderId: payment.order_id,
          event: "RECONCILE_PRE_EXPIRE_FAILED",
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }

    await applyPaymentOutcome(payment.id, "EXPIRED", null, "EXPIRED", "Pagamento expirado.");
    return {
      paymentId,
      orderId: payment.order_id,
      outcome: "EXPIRED_LOCAL",
      previousStatus,
      nextStatus: "EXPIRED",
      message: "Expirado localmente",
    };
  }

  const synced = await syncPaymentStatus(paymentId);
  if (!synced) {
    return {
      paymentId,
      orderId: payment.order_id,
      outcome: "ERROR",
      previousStatus,
      nextStatus: null,
      message: "Falha ao sincronizar",
    };
  }

  if (synced.status === previousStatus) {
    return {
      paymentId,
      orderId: payment.order_id,
      outcome: "UNCHANGED",
      previousStatus,
      nextStatus: synced.status,
      message: "Sem alteracao",
    };
  }

  let outcome: ReconciliationOutcome = "UPDATED";
  if (synced.status === "PAID") outcome = "GATEWAY_PAID";
  if (["FAILED", "CANCELLED", "EXPIRED"].includes(synced.status)) outcome = "GATEWAY_FAILED";

  return {
    paymentId,
    orderId: payment.order_id,
    outcome,
    previousStatus,
    nextStatus: synced.status,
    message: `${previousStatus} → ${synced.status}`,
  };
}

/** Reconcilia lote de pagamentos abertos (mais recentes primeiro). */
export async function reconcileOpenPayments(limit = 50): Promise<{
  scanned: number;
  results: ReconciliationResult[];
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("id")
    .in("status", ["CREATED", "PENDING", "WAITING_PAYMENT"])
    .neq("gateway", "ADVANCED_FEE")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));
  if (error) throw error;

  const results: ReconciliationResult[] = [];
  for (const row of data ?? []) {
    try {
      results.push(await reconcilePayment(row.id));
    } catch (err) {
      results.push({
        paymentId: row.id,
        orderId: "",
        outcome: "ERROR",
        previousStatus: "WAITING_PAYMENT",
        nextStatus: null,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logPayment("info", {
    event: "RECONCILE_BATCH",
    detail: {
      scanned: results.length,
      updated: results.filter((r) => r.outcome !== "UNCHANGED" && r.outcome !== "SKIPPED").length,
    },
  });

  return { scanned: results.length, results };
}

/**
 * Expira pagamentos e pedidos vencidos de forma idempotente.
 * Protege race: se gateway = PAID, nao libera numeros.
 */
export async function expireStalePayments(limit = 100): Promise<{ expired: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("id")
    .in("status", ["CREATED", "PENDING", "WAITING_PAYMENT"])
    .neq("gateway", "ADVANCED_FEE")
    .lt("expires_at", now)
    .order("expires_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  let expired = 0;
  for (const row of data ?? []) {
    const result = await reconcilePayment(row.id);
    if (result.outcome === "EXPIRED_LOCAL" || result.nextStatus === "EXPIRED") expired += 1;
  }

  return { expired };
}

/** Nova tentativa de PIX — nunca reutiliza Payment anterior. */
export async function retryPaymentForOrder(orderId: string): Promise<PaymentView> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Finaliza tentativas abertas localmente antes de criar nova
  const { data: open } = await supabaseAdmin
    .from("payments")
    .select("id, status, expires_at")
    .eq("order_id", orderId)
    .in("status", ["CREATED", "PENDING", "WAITING_PAYMENT"]);

  for (const payment of open ?? []) {
    await applyPaymentOutcome(
      payment.id,
      "EXPIRED",
      null,
      "SUPERSEDED",
      "Substituido por nova tentativa.",
    );
  }

  return createPixPaymentForOrder(orderId);
}

export async function loadPaymentAdminDetail(
  paymentId: string,
): Promise<PaymentAdminDetail | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: ledgerRaw, error } = await supabaseAdmin
    .from("admin_payment_ledger")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw error;
  if (!ledgerRaw) return null;
  const ledger = ledgerRaw as unknown as LedgerRow;

  const isManual = ledger.kind === "MANUAL";

  const [orderRes, campaignRes, customerRes, itemsRes] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("id, status, total, source, created_at, customer_id, campaign_id")
      .eq("id", ledger.order_id)
      .maybeSingle(),
    supabaseAdmin
      .from("campaigns")
      .select("id, title, slug")
      .eq("id", ledger.campaign_id)
      .maybeSingle(),
    ledger.customer_id
      ? supabaseAdmin
          .from("customers")
          .select("full_name, phone, email")
          .eq("id", ledger.customer_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabaseAdmin
      .from("order_items")
      .select("number")
      .eq("order_id", ledger.order_id)
      .order("number"),
  ]);

  let events: Array<{
    id: string;
    event_id: string;
    event_type: string;
    status: PaymentStatus | null;
    processed: boolean;
    error_message: string | null;
    created_at: string;
  }> = [];
  let attempts: PaymentView[] = [];
  let rawAttempts: PaymentRow[] = [];

  if (!isManual) {
    const [eventsRes, attemptsRes] = await Promise.all([
      supabaseAdmin
        .from("payment_events")
        .select("id, event_id, event_type, status, processed, error_message, created_at")
        .eq("payment_id", paymentId)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("payments")
        .select("*")
        .eq("order_id", ledger.order_id)
        .order("attempt_number", { ascending: true }),
    ]);
    events = eventsRes.data ?? [];
    rawAttempts = attemptsRes.data ?? [];
    attempts = rawAttempts.map(toPaymentView);
  }

  const view = toPaymentView(ledger as unknown as PaymentRow);
  const timeline: PaymentTimelineItem[] = [];
  if (orderRes.data) {
    timeline.push({
      at: orderRes.data.created_at,
      type: "ORDER_CREATED",
      label: "Pedido criado",
      status: orderRes.data.status,
    });
  }

  if (isManual) {
    timeline.push({
      at: ledger.paid_at ?? orderRes.data?.created_at ?? ledger.created_at,
      type: "PAYMENT_MANUAL",
      label: "Pagamento manual confirmado",
      status: ledger.status,
    });
  } else {
    for (const attempt of rawAttempts) {
      timeline.push({
        at: attempt.created_at,
        type: "PAYMENT_CREATED",
        label: `Pagamento #${attempt.attempt_number} criado`,
        status: attempt.status,
        detail: attempt.gateway,
      });
      if (attempt.pix_copy_paste || attempt.pix_qr_code) {
        timeline.push({
          at: attempt.created_at,
          type: "PIX_GENERATED",
          label: `PIX gerado (tentativa ${attempt.attempt_number})`,
          status: attempt.status,
        });
      }
      if (attempt.paid_at) {
        timeline.push({
          at: attempt.paid_at,
          type: "PAYMENT_PAID",
          label: "Pagamento confirmado",
          status: "PAID",
        });
      }
      if (attempt.status === "EXPIRED" && attempt.expires_at) {
        timeline.push({
          at: attempt.expires_at,
          type: "PAYMENT_EXPIRED",
          label: "Pagamento expirado",
          status: "EXPIRED",
        });
      }
    }

    for (const event of events) {
      timeline.push({
        at: event.created_at,
        type: event.event_type,
        label: `Webhook: ${event.event_type}`,
        status: event.status,
        detail: event.processed
          ? "processado"
          : event.error_message
            ? `erro: ${event.error_message}`
            : "pendente",
      });
    }
  }

  timeline.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return {
    payment: {
      ...view,
      gatewayPaymentId: ledger.gateway_payment_id,
      gatewayOrderId: ledger.gateway_order_id,
      failureCode: ledger.failure_code,
      orderId: ledger.order_id,
      campaignId: ledger.campaign_id,
      customerId: ledger.customer_id,
      kind: isManual ? "MANUAL" : "GATEWAY",
    },
    order: orderRes.data
      ? {
          id: orderRes.data.id,
          status: orderRes.data.status,
          total: Number(orderRes.data.total),
          source: orderRes.data.source,
          createdAt: orderRes.data.created_at,
        }
      : null,
    campaign: campaignRes.data
      ? {
          id: campaignRes.data.id,
          title: campaignRes.data.title,
          slug: campaignRes.data.slug,
        }
      : null,
    customer: customerRes.data
      ? {
          name: customerRes.data.full_name,
          phone: customerRes.data.phone,
          email: customerRes.data.email,
        }
      : null,
    numbers: (itemsRes.data ?? []).map((item) => Number(item.number)),
    events: events.map((event) => ({
      id: event.id,
      eventId: event.event_id,
      eventType: event.event_type,
      status: event.status,
      processed: event.processed,
      errorMessage: event.error_message,
      createdAt: event.created_at,
    })),
    timeline,
    attempts,
  };
}

export async function listPaymentsAdmin(input: {
  page: number;
  pageSize: number;
  gateway?: PaymentGateway;
  status?: PaymentStatus | "ALL";
  search?: string;
}): Promise<{
  items: Array<
    PaymentView & {
      orderId: string;
      campaignTitle: string | null;
      customerName: string | null;
      gatewayPaymentId: string | null;
      kind: PaymentLedgerKind;
    }
  >;
  total: number;
  metrics: {
    waiting: number;
    paid: number;
    expired: number;
    failed: number;
  };
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const page = Math.max(1, input.page);
  const pageSize = Math.min(Math.max(input.pageSize, 1), 50);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("admin_payment_ledger")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (input.gateway) {
    query = query.eq("gateway", input.gateway);
  }
  if (input.status && input.status !== "ALL") {
    query = query.eq("status", input.status);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as LedgerRow[];
  const orderIds = [...new Set(rows.map((row) => row.order_id))];
  const campaignIds = [...new Set(rows.map((row) => row.campaign_id))];
  const customerIds = [...new Set(rows.map((row) => row.customer_id).filter(Boolean))] as string[];

  const scopeGateway = <T>(query: T & { eq: (column: string, value: PaymentGateway) => T }): T => {
    if (!input.gateway) return query;
    return query.eq("gateway", input.gateway);
  };

  const [ordersRes, campaignsRes, customersRes, waiting, paid, expired, failed] = await Promise.all(
    [
      orderIds.length
        ? supabaseAdmin.from("orders").select("id, customer_id").in("id", orderIds)
        : Promise.resolve({
            data: [] as Array<{ id: string; customer_id: string | null }>,
            error: null,
          }),
      campaignIds.length
        ? supabaseAdmin.from("campaigns").select("id, title").in("id", campaignIds)
        : Promise.resolve({ data: [] as Array<{ id: string; title: string }>, error: null }),
      customerIds.length
        ? supabaseAdmin.from("customers").select("id, full_name").in("id", customerIds)
        : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }>, error: null }),
      scopeGateway(
        supabaseAdmin.from("admin_payment_ledger").select("id", { count: "exact", head: true }),
      ).in("status", ["CREATED", "PENDING", "WAITING_PAYMENT"]),
      scopeGateway(
        supabaseAdmin.from("admin_payment_ledger").select("id", { count: "exact", head: true }),
      ).eq("status", "PAID"),
      scopeGateway(
        supabaseAdmin.from("admin_payment_ledger").select("id", { count: "exact", head: true }),
      ).eq("status", "EXPIRED"),
      scopeGateway(
        supabaseAdmin.from("admin_payment_ledger").select("id", { count: "exact", head: true }),
      ).in("status", ["FAILED", "CANCELLED"]),
    ],
  );

  const campaignMap = new Map((campaignsRes.data ?? []).map((c) => [c.id, c.title]));
  const customerMap = new Map((customersRes.data ?? []).map((c) => [c.id, c.full_name]));
  const orderCustomerMap = new Map((ordersRes.data ?? []).map((o) => [o.id, o.customer_id]));

  let items = rows.map((row) => {
    const customerId = row.customer_id ?? orderCustomerMap.get(row.order_id) ?? null;
    return {
      ...toPaymentView(row as unknown as PaymentRow),
      orderId: row.order_id,
      campaignTitle: campaignMap.get(row.campaign_id) ?? null,
      customerName: customerId ? (customerMap.get(customerId) ?? null) : null,
      gatewayPaymentId: row.gateway_payment_id,
      kind: row.kind === "MANUAL" ? ("MANUAL" as const) : ("GATEWAY" as const),
    };
  });

  if (input.search?.trim()) {
    const q = input.search.trim().toLowerCase();
    items = items.filter(
      (item) =>
        item.id.toLowerCase().includes(q) ||
        item.orderId.toLowerCase().includes(q) ||
        (item.customerName ?? "").toLowerCase().includes(q) ||
        (item.campaignTitle ?? "").toLowerCase().includes(q) ||
        (item.gatewayPaymentId ?? "").toLowerCase().includes(q),
    );
  }

  return {
    items,
    total: count ?? items.length,
    metrics: {
      waiting: waiting.count ?? 0,
      paid: paid.count ?? 0,
      expired: expired.count ?? 0,
      failed: failed.count ?? 0,
    },
  };
}
