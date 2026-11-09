import { supabase } from "@/integrations/supabase/client";
import { auditService } from "@/services/audit.service";
import type { CustomerFormInput } from "@/schemas/customer.schema";
import type {
  Customer,
  CustomerListParams,
  CustomerListResult,
  CustomerWithStats,
} from "@/types/customer";

const CUSTOMER_COLUMNS =
  "id, full_name, phone, email, city, notes, created_by, created_at, updated_at, deleted_at";

export const customerService = {
  async list(params: CustomerListParams): Promise<CustomerListResult> {
    const { page, pageSize } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("customers")
      .select(CUSTOMER_COLUMNS, { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    const search = params.search?.trim();
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      items: (data ?? []) as unknown as Customer[],
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  /** Busca clientes para o seletor (até 30), incluindo pelos dígitos do telefone. */
  async search(query: string | undefined, limit = 30): Promise<Customer[]> {
    const term = query?.trim() ?? "";
    let request = supabase
      .from("customers")
      .select(CUSTOMER_COLUMNS)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (term) {
      request = request.or(
        `full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,city.ilike.%${term}%`,
      );
    }

    const { data, error } = await request;
    if (error) throw error;
    return (data ?? []) as unknown as Customer[];
  },

  /** Busca cliente pelo telefone exato (para detecção de duplicidade). */
  async findByPhone(phone: string): Promise<Customer | null> {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) return null;

    const { data, error } = await supabase
      .from("customers")
      .select(CUSTOMER_COLUMNS)
      .is("deleted_at", null)
      .or(`phone.ilike.%${digits}%,phone.ilike.%${phone.trim()}%`)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Customer | null) ?? null;
  },

  async getById(customerId: string): Promise<CustomerWithStats | null> {
    const { data: customer, error } = await supabase
      .from("customers")
      .select(CUSTOMER_COLUMNS)
      .eq("id", customerId)
      .maybeSingle();
    if (error) throw error;
    if (!customer) return null;

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("status, total, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (ordersError) throw ordersError;

    const list = (orders ?? []) as unknown as Array<{
      status: string;
      total: number;
      created_at: string;
    }>;
    const paid = list.filter((order) => order.status === "PAID");

    return {
      ...(customer as unknown as Customer),
      orders_count: list.length,
      total_spent: paid.reduce((sum, order) => sum + Number(order.total), 0),
      last_order_at: list[0]?.created_at ?? null,
    };
  },

  async create(input: CustomerFormInput): Promise<Customer> {
    const { data: auth } = await supabase.auth.getUser();
    const actorId = auth.user?.id;

    const { data, error } = await supabase
      .from("customers")
      .insert({
        full_name: input.full_name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        city: input.city?.trim() || null,
        notes: input.notes?.trim() || null,
        created_by: actorId ?? null,
      })
      .select(CUSTOMER_COLUMNS)
      .single();
    if (error) throw error;

    await auditService.log({
      action: "CUSTOMER_CREATED",
      entity: "customer",
      entityId: data.id,
      newValue: { full_name: data.full_name, phone: data.phone },
    });
    return data as unknown as Customer;
  },

  async update(customerId: string, input: CustomerFormInput): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .update({
        full_name: input.full_name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        city: input.city?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .eq("id", customerId)
      .select(CUSTOMER_COLUMNS)
      .single();
    if (error) throw error;

    await auditService.log({
      action: "CUSTOMER_UPDATED",
      entity: "customer",
      entityId: customerId,
      newValue: { full_name: data.full_name, phone: data.phone },
    });
    return data as unknown as Customer;
  },

  async softDelete(customerId: string): Promise<void> {
    const { error } = await supabase
      .from("customers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", customerId);
    if (error) throw error;

    await auditService.log({
      action: "CUSTOMER_DELETED",
      entity: "customer",
      entityId: customerId,
    });
  },
};
