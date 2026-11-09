import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/hooks/useTenant";
import { PaymentService } from "@/services/payments";
import type { PaymentGatewayProvider, PaymentMethodOnline } from "@/services/types";
import { describeError } from "@/services/types";

export function usePayments(
  campaignId: string | undefined,
  filters?: { status?: string; provider?: string; limit?: number; offset?: number },
) {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["payments", organizationId, campaignId, filters],
    queryFn: () => PaymentService.list(campaignId as string, filters),
    enabled: Boolean(organizationId && campaignId),
  });
}

export function usePaymentMetrics(campaignId: string | undefined) {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["payment-metrics", organizationId, campaignId],
    queryFn: () => PaymentService.metrics(campaignId as string),
    enabled: Boolean(organizationId && campaignId),
  });
}

export function usePayment(paymentId: string | undefined) {
  return useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => PaymentService.get(paymentId as string),
    enabled: Boolean(paymentId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "PENDING" || status === "PROCESSING") return 3000;
      return false;
    },
  });
}

export function usePublicPayment(paymentId: string | undefined) {
  return useQuery({
    queryKey: ["public-payment", paymentId],
    queryFn: () => PaymentService.publicGet(paymentId as string),
    enabled: Boolean(paymentId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "PENDING" || status === "PROCESSING") return 3000;
      return false;
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: (data: {
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
    }) => PaymentService.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments", organizationId, variables.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ["payment-metrics", organizationId, variables.campaign_id] });
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({ paymentId, campaignId }: { paymentId: string; campaignId: string }) =>
      PaymentService.confirm(paymentId),
    onSuccess: (_data, { paymentId, campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["payments", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["payment-metrics", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["payment", paymentId] });
      queryClient.invalidateQueries({ queryKey: ["sales", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["sales-metrics", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-numbers", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-number-metrics", organizationId, campaignId] });
      toast.success("Pagamento confirmado! Venda registrada.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useCancelPayment() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({ paymentId, campaignId }: { paymentId: string; campaignId: string }) =>
      PaymentService.cancel(paymentId),
    onSuccess: (_data, { paymentId, campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["payments", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["payment-metrics", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["payment", paymentId] });
      toast.success("Pagamento cancelado.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}
