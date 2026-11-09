import { supabase } from "@/integrations/supabase/client";
import { auditService } from "@/services/audit.service";
import { sanitizeFilename, validateFile } from "@/services/storage.service";
import type {
  Order,
  OrderFilters,
  OrderItem,
  OrderListParams,
  OrderListResult,
  OrderMetrics,
  OrderRpcResult,
  OrderStatus,
  OrderWithRelations,
  PaymentMethod,
} from "@/types/order";

export const ORDER_RECEIPTS_BUCKET = "order-receipts";

const ORDER_COLUMNS =
  "id, campaign_id, customer_id, reservation_token, source, status, payment_method, subtotal, discount, total, notes, created_by, created_at, updated_at";

const ORDER_RELATION_COLUMNS = `${ORDER_COLUMNS}, customer:customers(*), campaign:campaigns(id, title), items:order_items(*), receipts:order_receipts(*)`;

function rpcError(result: OrderRpcResult | null, error: { message?: string } | null): Error {
  if (error?.message) return new Error(error.message);
  if (!result) return new Error("Falha de comunicação com o servidor");
  const messages: Record<string, string> = {
    FORBIDDEN: "Você não tem permissão para esta ação.",
    CAMPAIGN_NOT_FOUND: "Campanha não encontrada.",
    CAMPAIGN_NOT_ACTIVE: "A campanha não está ativa.",
    ORDER_NOT_FOUND: "Pedido não encontrado.",
    ORDER_LOCKED: "Este pedido não pode mais ser editado.",
    NO_NUMBERS: "Selecione ao menos um número.",
    NUMBER_OUT_OF_RANGE: "Um ou mais números estão fora da faixa da campanha.",
    NUMBER_NOT_IN_ORDER: "Um ou mais números não pertencem a este pedido.",
    SAME_NUMBER: "Informe um número diferente para a troca.",
    INVALID_RESERVATION: "Reserva inválida.",
    RESERVATION_NOT_FOUND: "A reserva não foi encontrada ou expirou.",
    CUSTOMER_NOT_FOUND: "Cliente não encontrado.",
    INVALID_TRANSITION: "Transição de status inválida.",
    CONFLICT: "Um ou mais números já não estão disponíveis.",
  };
  return new Error(
    result.error ? (messages[result.error] ?? result.error) : "Não foi possível concluir.",
  );
}

export const orderService = {
  ORDER_RECEIPTS_BUCKET,

  async list(params: OrderListParams): Promise<OrderListResult> {
    const { page, pageSize } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const filters = params.filters;

    if (filters?.createdBy) {
      const { data: ownedCampaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("created_by", filters.createdBy);
      const campaignIds = (ownedCampaigns ?? []).map((c) => c.id);
      if (campaignIds.length === 0) {
        return { items: [], total: 0, page, pageSize };
      }
      if (!filters.campaignId || !campaignIds.includes(filters.campaignId)) {
        return { items: [], total: 0, page, pageSize };
      }
    }

    let query = supabase
      .from("orders")
      .select(ORDER_RELATION_COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters?.campaignId) query = query.eq("campaign_id", filters.campaignId);
    if (filters?.status && filters.status !== "ALL") query = query.eq("status", filters.status);
    if (filters?.source && filters.source !== "ALL") query = query.eq("source", filters.source);
    if (filters?.customerId) query = query.eq("customer_id", filters.customerId);

    const search = filters?.search?.trim();
    if (search) {
      const { data: matches } = await supabase
        .from("customers")
        .select("id")
        .is("deleted_at", null)
        .or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(50);
      const ids = (matches ?? []).map((row) => row.id);
      if (ids.length === 0) {
        return { items: [], total: 0, page, pageSize };
      }
      query = query.in("customer_id", ids);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      items: (data ?? []) as unknown as OrderWithRelations[],
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async getById(orderId: string): Promise<OrderWithRelations | null> {
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_RELATION_COLUMNS)
      .eq("id", orderId)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as OrderWithRelations | null) ?? null;
  },

  async createManual(input: {
    campaignId: string;
    customerId: string | null;
    paymentMethod: PaymentMethod | null;
    discount: number;
    notes: string;
    numbers: number[];
    initialStatus?: OrderStatus;
  }): Promise<OrderRpcResult> {
    const { data, error } = await supabase.rpc("create_manual_order", {
      p_campaign_id: input.campaignId,
      p_customer_id: input.customerId as string,
      p_payment_method: input.paymentMethod as NonNullable<PaymentMethod>,
      p_discount: input.discount,
      p_notes: (input.notes || null) as string,
      p_numbers: input.numbers,
      p_initial_status: input.initialStatus || "OPEN",
    });
    if (error) throw error;
    const result = data as unknown as OrderRpcResult;
    if (!result.ok) throw rpcError(result, null);
    return result;
  },

  async createWhatsApp(input: {
    campaignId: string;
    token: string;
    reservedBy: string;
    customerName: string;
    customerPhone: string;
  }): Promise<OrderRpcResult> {
    const { data, error } = await supabase.rpc("create_whatsapp_order", {
      p_campaign_id: input.campaignId,
      p_token: input.token,
      p_reserved_by: input.reservedBy,
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
    });
    if (error) throw error;
    const result = data as unknown as OrderRpcResult;
    if (!result.ok) throw rpcError(result, null);
    return result;
  },

  async addNumbers(orderId: string, numbers: number[]): Promise<OrderRpcResult> {
    const { data, error } = await supabase.rpc("add_order_numbers", {
      p_order_id: orderId,
      p_numbers: numbers,
    });
    if (error) throw error;
    const result = data as unknown as OrderRpcResult;
    if (!result.ok) throw rpcError(result, null);
    return result;
  },

  async removeNumbers(orderId: string, numbers: number[]): Promise<OrderRpcResult> {
    const { data, error } = await supabase.rpc("remove_order_numbers", {
      p_order_id: orderId,
      p_numbers: numbers,
    });
    if (error) throw error;
    const result = data as unknown as OrderRpcResult;
    if (!result.ok) throw rpcError(result, null);
    return result;
  },

  async swapNumber(orderId: string, oldNumber: number, newNumber: number): Promise<OrderRpcResult> {
    const { data, error } = await supabase.rpc("swap_order_number", {
      p_order_id: orderId,
      p_old_number: oldNumber,
      p_new_number: newNumber,
    });
    if (error) throw error;
    const result = data as unknown as OrderRpcResult;
    if (!result.ok) throw rpcError(result, null);
    return result;
  },

  async setStatus(orderId: string, status: OrderStatus): Promise<OrderRpcResult> {
    const { data, error } = await supabase.rpc("set_order_status", {
      p_order_id: orderId,
      p_status: status,
    });
    if (error) throw error;
    const result = data as unknown as OrderRpcResult;
    if (!result.ok) throw rpcError(result, null);
    return result;
  },

  async importSoldNumbers(input: {
    campaignId: string;
    customerId: string | null;
    paymentMethod: PaymentMethod | null;
    notes: string;
    numbers: number[];
  }): Promise<OrderRpcResult> {
    const { data, error } = await supabase.rpc("import_sold_numbers", {
      p_campaign_id: input.campaignId,
      p_customer_id: input.customerId as string,
      p_payment_method: input.paymentMethod as NonNullable<PaymentMethod>,
      p_notes: (input.notes || null) as string,
      p_numbers: input.numbers,
    });
    if (error) throw error;
    const result = data as unknown as OrderRpcResult;
    if (!result.ok) throw rpcError(result, null);
    return result;
  },

  async uploadReceipt(orderId: string, file: File): Promise<string> {
    const validation = validateFile(file, {
      allowedTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"],
    });
    if (validation) throw new Error(validation);

    const { data: auth } = await supabase.auth.getUser();
    const actorId = auth.user?.id ?? null;
    const path = `orders/${orderId}/${Date.now()}-${sanitizeFilename(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(ORDER_RECEIPTS_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;

    const { data: receipt, error } = await supabase
      .from("order_receipts")
      .insert({
        order_id: orderId,
        filename: file.name,
        storage_path: path,
        mime_type: file.type || "application/octet-stream",
        size: file.size,
        uploaded_by: actorId,
      })
      .select("id")
      .single();
    if (error) throw error;

    await auditService.log({
      action: "RECEIPT_UPLOADED",
      entity: "order_receipt",
      entityId: receipt.id,
      metadata: { order_id: orderId },
    });
    return receipt.id;
  },

  async listReceipts(orderId: string) {
    const { data, error } = await supabase
      .from("order_receipts")
      .select("id, filename, storage_path, mime_type, size, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async receiptUrl(storagePath: string): Promise<string | null> {
    const { data } = await supabase.storage
      .from(ORDER_RECEIPTS_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);
    return data?.signedUrl ?? null;
  },

  async deleteOrder(orderId: string): Promise<void> {
    const { data: order } = await supabase
      .from("orders")
      .select("id, campaign_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) throw new Error("Pedido nao encontrado");

    await supabase.from("order_receipts").delete().eq("order_id", orderId);
    await supabase.from("order_items").delete().eq("order_id", orderId);
    await supabase
      .from("campaign_numbers")
      .delete()
      .eq("purchase_id", orderId)
      .eq("campaign_id", order.campaign_id);
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) throw error;
  },

  async deleteReceipt(receiptId: string, storagePath: string): Promise<void> {
    const { error: storageError } = await supabase.storage
      .from(ORDER_RECEIPTS_BUCKET)
      .remove([storagePath]);
    if (storageError) throw storageError;
    const { error } = await supabase.from("order_receipts").delete().eq("id", receiptId);
    if (error) throw error;
  },

  async metrics(createdBy?: string): Promise<OrderMetrics> {
    let campaignQuery = supabase.from("campaigns").select("id, title").is("deleted_at", null);
    if (createdBy) campaignQuery = campaignQuery.eq("created_by", createdBy);
    const campaignResult = await campaignQuery;

    const campaignIds = new Set((campaignResult.data ?? []).map((c) => c.id));
    const titles = new Map((campaignResult.data ?? []).map((c) => [c.id, c.title]));

    let orderQuery = supabase
      .from("orders")
      .select("campaign_id, customer_id, source, status, total");
    if (createdBy) {
      if (campaignIds.size === 0) {
        return {
          totalOrders: 0,
          open: 0,
          waitingContact: 0,
          waitingPayment: 0,
          paid: 0,
          cancelled: 0,
          expired: 0,
          refunded: 0,
          revenue: 0,
          numbersSold: 0,
          whatsappOrders: 0,
          manualOrders: 0,
          onlineOrders: 0,
          customerCount: 0,
          recurringCustomers: 0,
          averageTicket: 0,
          byCampaign: [],
        };
      }
      orderQuery = orderQuery.in("campaign_id", [...campaignIds]);
    }
    const [{ data: rows, error: rowsError }] = await Promise.all([orderQuery]);

    let customerResult: { data: { id: string }[] | null; error: null } = {
      data: null,
      error: null,
    };
    if (!createdBy) {
      const r = await supabase.from("customers").select("id").is("deleted_at", null);
      customerResult = { data: r.data, error: null } as typeof customerResult;
    }
    if (rowsError) throw rowsError;
    const customerOrderCounts = new Map<string, number>();

    const metrics: OrderMetrics = {
      totalOrders: 0,
      open: 0,
      waitingContact: 0,
      waitingPayment: 0,
      paid: 0,
      cancelled: 0,
      expired: 0,
      refunded: 0,
      revenue: 0,
      numbersSold: 0,
      whatsappOrders: 0,
      manualOrders: 0,
      onlineOrders: 0,
      customerCount: createdBy
        ? new Set(
            (rows ?? [])
              .map((r) => (r as { customer_id: string | null }).customer_id)
              .filter((id): id is string => Boolean(id)),
          ).size
        : (customerResult.data?.length ?? 0),
      recurringCustomers: 0,
      averageTicket: 0,
      byCampaign: [],
    };

    const byCampaignMap = new Map<
      string,
      { campaign_id: string; campaign_title: string; orders: number; paid: number; revenue: number }
    >();

    for (const row of (rows ?? []) as unknown as Array<{
      campaign_id: string;
      customer_id: string | null;
      source: string;
      status: OrderStatus;
      total: number;
    }>) {
      metrics.totalOrders++;
      if (row.source === "WHATSAPP") metrics.whatsappOrders++;
      else if (row.source === "MANUAL") metrics.manualOrders++;
      else if (row.source === "ONLINE") metrics.onlineOrders++;

      if (row.customer_id) {
        const count = (customerOrderCounts.get(row.customer_id) ?? 0) + 1;
        customerOrderCounts.set(row.customer_id, count);
      }

      const key = row.campaign_id;
      const entry = byCampaignMap.get(key) ?? {
        campaign_id: key,
        campaign_title: titles.get(key) ?? "Campanha",
        orders: 0,
        paid: 0,
        revenue: 0,
      };
      entry.orders++;
      switch (row.status) {
        case "OPEN":
          metrics.open++;
          break;
        case "WAITING_CONTACT":
          metrics.waitingContact++;
          break;
        case "WAITING_PAYMENT":
          metrics.waitingPayment++;
          break;
        case "PAID": {
          metrics.paid++;
          entry.paid++;
          const value = Number(row.total);
          metrics.revenue += value;
          entry.revenue += value;
          break;
        }
        case "CANCELLED":
          metrics.cancelled++;
          break;
        case "EXPIRED":
          metrics.expired++;
          break;
        case "REFUNDED":
          metrics.refunded++;
          break;
      }
      byCampaignMap.set(key, entry);
    }

    metrics.recurringCustomers = [...customerOrderCounts.values()].filter((c) => c > 1).length;
    metrics.averageTicket = metrics.paid > 0 ? metrics.revenue / metrics.paid : 0;

    // Count sold numbers from campaign_numbers (source of truth, includes WINNER)
    let numbersQuery = supabase
      .from("campaign_numbers")
      .select("id", { count: "exact", head: true })
      .in("status", ["PAID", "WINNER"]);
    if (createdBy && campaignIds.size > 0) {
      numbersQuery = numbersQuery.in("campaign_id", [...campaignIds]);
    }
    const { count: numbersSold } = await numbersQuery;
    if (numbersSold === null) throw new Error("Falha ao contar numeros vendidos");
    metrics.numbersSold = numbersSold;

    metrics.byCampaign = [...byCampaignMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    return metrics;
  },
};
