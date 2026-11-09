import { supabase } from "@/integrations/supabase/client";
import { rpcArgs } from "@/lib/rpc";
import type {
  Payment,
  PaymentGateway,
  PaymentGatewayProvider,
  PaymentMethodOnline,
  PaymentStatus,
  CampaignPaymentMetrics,
  PublicPaymentView,
} from "./types";

export interface PaginatedPayments {
  items: Payment[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginatedGateways {
  items: PaymentGateway[];
}

export const PaymentService = {
  async create(data: {
    campaign_id: string;
    reservation_id?: string;
    gateway_id?: string;
    provider?: PaymentGatewayProvider;
    method?: PaymentMethodOnline;
    amount?: number;
    buyer_name?: string;
    buyer_phone?: string;
    buyer_email?: string;
    buyer_document?: string;
  }): Promise<string> {
    const { data: result, error } = await supabase.rpc(
      "create_payment" as never,
      rpcArgs({
        _campaign: data.campaign_id,
        _reservation: data.reservation_id,
        _gateway: data.gateway_id,
        _provider: data.provider,
        _method: data.method,
        _amount: data.amount,
        _buyer_name: data.buyer_name,
        _buyer_phone: data.buyer_phone,
        _buyer_email: data.buyer_email,
        _buyer_document: data.buyer_document,
      }) as never,
    );
    if (error) throw error;
    return result as unknown as string;
  },

  async updateStatus(
    paymentId: string,
    status: PaymentStatus,
    opts?: {
      provider_payment_id?: string;
      pix_code?: string;
      pix_qr_base64?: string;
      gateway_response?: Record<string, unknown>;
    },
  ): Promise<void> {
    const { error } = await supabase.rpc(
      "update_payment_status" as never,
      rpcArgs({
        _payment: paymentId,
        _status: status,
        _provider_payment_id: opts?.provider_payment_id,
        _pix_code: opts?.pix_code,
        _pix_qr_base64: opts?.pix_qr_base64,
        _gateway_response: opts?.gateway_response,
      }) as never,
    );
    if (error) throw error;
  },

  async confirm(paymentId: string): Promise<string> {
    const { data: result, error } = await supabase.rpc("confirm_payment" as never, {
      _payment: paymentId,
    } as never);
    if (error) throw error;
    return result as unknown as string;
  },

  async cancel(paymentId: string): Promise<void> {
    const { error } = await supabase.rpc("cancel_payment" as never, {
      _payment: paymentId,
    } as never);
    if (error) throw error;
  },

  async get(paymentId: string): Promise<Payment> {
    const { data, error } = await supabase.rpc("get_payment" as never, {
      _payment: paymentId,
    } as never);
    if (error) throw error;
    return data as unknown as Payment;
  },

  async publicGet(paymentId: string): Promise<PublicPaymentView> {
    const { data, error } = await supabase.rpc("public_get_payment" as never, {
      _payment: paymentId,
    } as never);
    if (error) throw error;
    return data as unknown as PublicPaymentView;
  },

  async list(
    campaignId: string,
    opts?: {
      status?: string;
      provider?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<PaginatedPayments> {
    const { data, error } = await supabase.rpc(
      "list_payments" as never,
      rpcArgs({
        _campaign: campaignId,
        _status: opts?.status,
        _provider: opts?.provider,
        _limit: opts?.limit,
        _offset: opts?.offset,
      }) as never,
    );
    if (error) throw error;
    return (data as unknown as PaginatedPayments) ?? { items: [], total: 0, limit: 50, offset: 0 };
  },

  async metrics(campaignId: string): Promise<CampaignPaymentMetrics> {
    const { data, error } = await supabase.rpc("campaign_payment_metrics" as never, {
      _campaign: campaignId,
    } as never);
    if (error) throw error;
    return (data as unknown as CampaignPaymentMetrics) ?? {
      total_revenue: 0, confirmed_count: 0, pending_count: 0,
      failed_count: 0, cancelled_count: 0, refunded_count: 0, total_count: 0,
    };
  },
};

export const PaymentGatewayService = {
  async create(
    organizationId: string,
    data: {
      provider: PaymentGatewayProvider;
      label: string;
      enabled?: boolean;
      credentials?: string;
      settings?: Record<string, unknown>;
    },
  ): Promise<string> {
    const { data: result, error } = await supabase.rpc(
      "create_payment_gateway" as never,
      rpcArgs({
        _organization: organizationId,
        _provider: data.provider,
        _label: data.label,
        _enabled: data.enabled,
        _credentials: data.credentials,
        _settings: data.settings,
      }) as never,
    );
    if (error) throw error;
    return result as unknown as string;
  },

  async update(
    gatewayId: string,
    data: {
      label?: string;
      enabled?: boolean;
      credentials?: string;
      settings?: Record<string, unknown>;
    },
  ): Promise<void> {
    const { error } = await supabase.rpc(
      "update_payment_gateway" as never,
      rpcArgs({
        _gateway: gatewayId,
        _label: data.label,
        _enabled: data.enabled,
        _credentials: data.credentials,
        _settings: data.settings,
      }) as never,
    );
    if (error) throw error;
  },

  async list(organizationId: string): Promise<PaginatedGateways> {
    const { data, error } = await supabase.rpc("list_payment_gateways" as never, {
      _organization: organizationId,
    } as never);
    if (error) throw error;
    return (data as unknown as PaginatedGateways) ?? { items: [] };
  },

  async delete(gatewayId: string): Promise<void> {
    const { error } = await supabase.rpc("delete_payment_gateway" as never, {
      _gateway: gatewayId,
    } as never);
    if (error) throw error;
  },
};
