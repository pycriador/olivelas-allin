import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "@/lib/iam/permissions.server";
import { PAYMENT_GATEWAY_LABELS, PAYMENT_STATUS_LABELS } from "@/types/payment";

type AdminClient = typeof import("@/integrations/supabase/client.server").supabaseAdmin;

export const REPORT_IDS = ["customers", "payments", "campaigns", "finance", "orders"] as const;
export type ReportId = (typeof REPORT_IDS)[number];

export interface ReportData {
  report: ReportId;
  title: string;
  headers: string[];
  rows: string[][];
}

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  FINISHED: "Finalizada",
  CANCELLED: "Cancelada",
  ARCHIVED: "Arquivada",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberta",
  WAITING_CONTACT: "Aguardando contato",
  WAITING_PAYMENT: "Aguardando pagamento",
  PAID: "Paga",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  REFUNDED: "Reembolsada",
};

const ORDER_SOURCE_LABELS: Record<string, string> = {
  ONLINE: "Online",
  WHATSAPP: "WhatsApp",
  MANUAL: "Manual",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO: "Cartao",
  TRANSFERENCIA: "Transferencia",
  MERCADO_PAGO: "Mercado Pago",
  PAGBANK: "PagBank",
  INFINITYPAY: "InfinityPay",
  OUTRO: "Outro",
};

const LEDGER_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartao de credito",
  DEBIT_CARD: "Cartao de debito",
  BOLETO: "Boleto",
};

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR");
}

function fmtMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

/** Busca todas as linhas paginando em blocos (PostgREST limita por padrao). */
async function fetchAllRows(
  query: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
  limit = 100_000,
): Promise<Array<any>> {
  const rows: Array<any> = [];
  const CHUNK = 1000;
  for (let from = 0; from < limit; from += CHUNK) {
    const { data, error } = await query(from, from + CHUNK - 1);
    if (error) throw new Error(error.message);
    const chunk = (data ?? []) as Array<any>;
    rows.push(...chunk);
    if (chunk.length < CHUNK) break;
  }
  return rows;
}

async function buildCustomersReport(supabaseAdmin: AdminClient): Promise<ReportData> {
  const rows = await fetchAllRows((f, t) =>
    supabaseAdmin
      .from("customers")
      .select("id, full_name, phone, email, city, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(f, t),
  );

  const ids = rows.map((r) => r.id as string);
  const stats = new Map<string, { count: number; total: number }>();
  if (ids.length > 0) {
    const orderRows = await fetchAllRows((f, t) =>
      supabaseAdmin
        .from("orders")
        .select("customer_id, total, status")
        .in("customer_id", ids)
        .range(f, t),
    );
    for (const o of orderRows) {
      const cid = o.customer_id as string | null;
      if (!cid) continue;
      const s = stats.get(cid) ?? { count: 0, total: 0 };
      s.count += 1;
      if (o.status === "PAID" || o.status === "REFUNDED") s.total += o.total as number;
      stats.set(cid, s);
    }
  }

  return {
    report: "customers",
    title: "Clientes",
    headers: ["Cliente", "Telefone", "Email", "Cidade", "Pedidos", "Total gasto", "Cadastro"],
    rows: rows.map((r) => {
      const s = stats.get(r.id as string);
      return [
        String(r.full_name ?? ""),
        String(r.phone ?? ""),
        String(r.email ?? ""),
        String(r.city ?? ""),
        String(s?.count ?? 0),
        fmtMoney(s?.total ?? 0),
        fmtDate(r.created_at as string),
      ];
    }),
  };
}

async function buildPaymentsReport(supabaseAdmin: AdminClient): Promise<ReportData> {
  const rows = await fetchAllRows((f, t) =>
    supabaseAdmin
      .from("admin_payment_ledger")
      .select("*")
      .order("created_at", { ascending: false })
      .range(f, t),
  );

  const campaignIds = [...new Set(rows.map((r) => r.campaign_id as string))];
  const customerIds = [
    ...new Set(rows.map((r) => r.customer_id as string | null).filter(Boolean)),
  ] as string[];

  const [campaigns, customers] = await Promise.all([
    fetchAllRows((f, t) =>
      campaignIds.length
        ? supabaseAdmin.from("campaigns").select("id, title").in("id", campaignIds).range(f, t)
        : Promise.resolve({ data: [], error: null }),
    ),
    fetchAllRows((f, t) =>
      customerIds.length
        ? supabaseAdmin.from("customers").select("id, full_name").in("id", customerIds).range(f, t)
        : Promise.resolve({ data: [], error: null }),
    ),
  ]);

  const titleMap = new Map(campaigns.map((c) => [c.id, c.title]));
  const customerMap = new Map(customers.map((c) => [c.id, c.full_name]));

  return {
    report: "payments",
    title: "Pagamentos",
    headers: [
      "Data",
      "Pedido",
      "Campanha",
      "Cliente",
      "Tipo",
      "Gateway",
      "Status",
      "Metodo",
      "Valor",
      "Pago em",
    ],
    rows: rows.map((r) => [
      fmtDate(r.created_at as string),
      String(r.order_id ?? ""),
      String(titleMap.get(r.campaign_id as string) ?? ""),
      String(customerMap.get(r.customer_id as string) ?? ""),
      r.kind === "MANUAL" ? "Manual" : "Gateway",
      PAYMENT_GATEWAY_LABELS[r.gateway as keyof typeof PAYMENT_GATEWAY_LABELS] ??
        String(r.gateway ?? ""),
      PAYMENT_STATUS_LABELS[r.status as keyof typeof PAYMENT_STATUS_LABELS] ??
        String(r.status ?? ""),
      LEDGER_METHOD_LABELS[r.method as string] ?? String(r.method ?? ""),
      fmtMoney(r.amount as number),
      fmtDate(r.paid_at as string),
    ]),
  };
}

async function buildCampaignsReport(supabaseAdmin: AdminClient): Promise<ReportData> {
  const rows = await fetchAllRows((f, t) =>
    supabaseAdmin
      .from("campaigns")
      .select("id, title, product_name, price_per_number, total_numbers, status, visibility, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(f, t),
  );

  return {
    report: "campaigns",
    title: "Rifas",
    headers: [
      "Rifa",
      "Produto",
      "Valor por numero",
      "Total de numeros",
      "Valor estimado",
      "Status",
      "Visibilidade",
      "Criada em",
    ],
    rows: rows.map((r) => {
      const total = (r.total_numbers as number | null) ?? 0;
      const price = r.price_per_number as number;
      return [
        String(r.title ?? ""),
        String(r.product_name ?? ""),
        fmtMoney(price),
        String(total),
        fmtMoney(total * price),
        CAMPAIGN_STATUS_LABELS[r.status as string] ?? String(r.status ?? ""),
        r.visibility === "PUBLIC" ? "Publica" : "Privada",
        fmtDate(r.created_at as string),
      ];
    }),
  };
}

async function buildFinanceReport(supabaseAdmin: AdminClient): Promise<ReportData> {
  const orderRows = await fetchAllRows((f, t) =>
    supabaseAdmin
      .from("orders")
      .select("campaign_id, total, status")
      .range(f, t),
  );

  const agg = new Map<string, { orders: number; paid: number; paidTotal: number; refundedTotal: number }>();
  for (const o of orderRows) {
    const cid = o.campaign_id as string;
    const s = agg.get(cid) ?? { orders: 0, paid: 0, paidTotal: 0, refundedTotal: 0 };
    s.orders += 1;
    if (o.status === "PAID") {
      s.paid += 1;
      s.paidTotal += o.total as number;
    } else if (o.status === "REFUNDED") {
      s.refundedTotal += o.total as number;
    }
    agg.set(cid, s);
  }

  const campaignIds = [...agg.keys()];
  const campaigns = await fetchAllRows((f, t) =>
    campaignIds.length
      ? supabaseAdmin.from("campaigns").select("id, title").in("id", campaignIds).range(f, t)
      : Promise.resolve({ data: [], error: null }),
  );
  const titleMap = new Map(campaigns.map((c) => [c.id, c.title]));

  const totals = { orders: 0, paid: 0, paidTotal: 0, refundedTotal: 0 };
  for (const s of agg.values()) {
    totals.orders += s.orders;
    totals.paid += s.paid;
    totals.paidTotal += s.paidTotal;
    totals.refundedTotal += s.refundedTotal;
  }

  const rows = [...agg.entries()]
    .map(([cid, s]) => [
      String(titleMap.get(cid) ?? cid),
      String(s.orders),
      String(s.paid),
      fmtMoney(s.paidTotal),
      fmtMoney(s.refundedTotal),
      fmtMoney(s.paidTotal - s.refundedTotal),
    ])
    .sort((a, b) => parseFloat((b[3] ?? "").replace(/\D/g, "")) - parseFloat((a[3] ?? "").replace(/\D/g, "")));

  rows.push([
    "(TOTAL)",
    String(totals.orders),
    String(totals.paid),
    fmtMoney(totals.paidTotal),
    fmtMoney(totals.refundedTotal),
    fmtMoney(totals.paidTotal - totals.refundedTotal),
  ]);

  return {
    report: "finance",
    title: "Financeiro (valores)",
    headers: ["Campanha", "Pedidos", "Pagos", "Receita paga", "Reembolsado", "Liquido"],
    rows,
  };
}

async function buildOrdersReport(supabaseAdmin: AdminClient): Promise<ReportData> {
  const rows = await fetchAllRows((f, t) =>
    supabaseAdmin
      .from("orders")
      .select("id, campaign_id, customer_id, status, source, payment_method, total, created_at")
      .order("created_at", { ascending: false })
      .range(f, t),
  );

  const campaignIds = [...new Set(rows.map((r) => r.campaign_id as string))];
  const customerIds = [
    ...new Set(rows.map((r) => r.customer_id as string | null).filter(Boolean)),
  ] as string[];

  const [campaigns, customers] = await Promise.all([
    fetchAllRows((f, t) =>
      campaignIds.length
        ? supabaseAdmin.from("campaigns").select("id, title").in("id", campaignIds).range(f, t)
        : Promise.resolve({ data: [], error: null }),
    ),
    fetchAllRows((f, t) =>
      customerIds.length
        ? supabaseAdmin.from("customers").select("id, full_name").in("id", customerIds).range(f, t)
        : Promise.resolve({ data: [], error: null }),
    ),
  ]);

  const titleMap = new Map(campaigns.map((c) => [c.id, c.title]));
  const customerMap = new Map(customers.map((c) => [c.id, c.full_name]));

  return {
    report: "orders",
    title: "Pedidos",
    headers: ["Pedido", "Campanha", "Cliente", "Status", "Origem", "Metodo", "Total", "Data"],
    rows: rows.map((r) => [
      String(r.id ?? ""),
      String(titleMap.get(r.campaign_id as string) ?? ""),
      String(customerMap.get(r.customer_id as string) ?? ""),
      ORDER_STATUS_LABELS[r.status as string] ?? String(r.status ?? ""),
      ORDER_SOURCE_LABELS[r.source as string] ?? String(r.source ?? ""),
      PAYMENT_METHOD_LABELS[r.payment_method as string] ?? String(r.payment_method ?? ""),
      fmtMoney(r.total as number),
      fmtDate(r.created_at as string),
    ]),
  };
}

const reportSchema = z.object({
  report: z.enum(REPORT_IDS),
});

export const getReportDataAdminFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(reportSchema)
  .handler(async ({ context, data }) => {
    const permissionByReport: Record<ReportId, string> = {
      customers: "reports.customer.view",
      payments: "reports.payment.view",
      campaigns: "reports.campaign.view",
      finance: "reports.finance.view",
      orders: "reports.orders.view",
    };
    await requirePermission(context.userId, permissionByReport[data.report]);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    switch (data.report) {
      case "customers":
        return buildCustomersReport(supabaseAdmin);
      case "payments":
        return buildPaymentsReport(supabaseAdmin);
      case "campaigns":
        return buildCampaignsReport(supabaseAdmin);
      case "finance":
        return buildFinanceReport(supabaseAdmin);
      case "orders":
        return buildOrdersReport(supabaseAdmin);
    }
  });
