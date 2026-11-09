import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  requireGatewayManage,
  requireGatewayView,
  requirePermission,
} from "@/lib/iam/permissions.server";
import {
  PAYMENT_GATEWAY_VALUES,
  PAYMENT_STATUS_VALUES,
  type PaymentGateway,
  type PaymentStatus,
} from "@/types/payment";
import {
  expireStalePayments,
  listPaymentsAdmin,
  loadPaymentAdminDetail,
  reconcileOpenPayments,
  reconcilePayment,
  retryPaymentForOrder,
} from "./reconciliation.server";

async function loadPaymentGateway(paymentId: string): Promise<PaymentGateway | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("gateway")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw error;
  return data?.gateway ?? null;
}

async function loadOrderGateway(orderId: string): Promise<PaymentGateway | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("gateway")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.gateway ?? null;
}

const listSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(15),
  gateway: z
    .enum([
      ...(PAYMENT_GATEWAY_VALUES as unknown as [PaymentGateway, ...PaymentGateway[]]),
      "ALL",
    ] as [PaymentGateway | "ALL", ...(PaymentGateway | "ALL")[]])
    .default("ALL"),
  status: z
    .enum([...(PAYMENT_STATUS_VALUES as unknown as [PaymentStatus, ...PaymentStatus[]]), "ALL"] as [
      PaymentStatus | "ALL",
      ...(PaymentStatus | "ALL")[],
    ])
    .default("ALL"),
  search: z.string().optional(),
});

export const listPaymentsAdminFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(listSchema)
  .handler(async ({ context, data }) => {
    if (data.gateway && data.gateway !== "ALL") {
      await requireGatewayView(context.userId, data.gateway);
    } else {
      await requirePermission(context.userId, "payments.view");
    }
    return listPaymentsAdmin({
      page: data.page,
      pageSize: data.pageSize,
      ...(data.gateway && data.gateway !== "ALL" ? { gateway: data.gateway } : {}),
      status: data.status,
      ...(data.search !== undefined ? { search: data.search } : {}),
    });
  });

const idSchema = z.object({
  paymentId: z.string().uuid(),
});

export const getPaymentDetailAdminFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const detail = await loadPaymentAdminDetail(data.paymentId);
    if (!detail) return null;
    await requireGatewayView(context.userId, detail.payment.gateway);
    return detail;
  });

export const reconcilePaymentAdminFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(idSchema)
  .handler(async ({ context, data }) => {
    const gateway = await loadPaymentGateway(data.paymentId);
    if (!gateway) throw new Error("Pagamento nao encontrado");
    await requireGatewayManage(context.userId, gateway);
    return reconcilePayment(data.paymentId);
  });

const batchSchema = z.object({
  limit: z.number().int().min(1).max(200).default(50),
});

export const reconcileOpenPaymentsAdminFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(batchSchema)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "payments.manage");
    return reconcileOpenPayments(data.limit);
  });

export const expireStalePaymentsAdminFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(batchSchema)
  .handler(async ({ context, data }) => {
    await requirePermission(context.userId, "payments.manage");
    return expireStalePayments(data.limit);
  });

const retrySchema = z.object({
  orderId: z.string().uuid(),
});

export const retryPaymentAdminFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(retrySchema)
  .handler(async ({ context, data }) => {
    const gateway = await loadOrderGateway(data.orderId);
    if (!gateway) throw new Error("Pedido sem pagamento via gateway");
    await requireGatewayManage(context.userId, gateway);
    return retryPaymentForOrder(data.orderId);
  });
