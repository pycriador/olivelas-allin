import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/hooks/useTenant";
import { PaymentGatewayService } from "@/services/payments";
import type { PaymentGatewayProvider } from "@/services/types";
import { describeError } from "@/services/types";

export function usePaymentGateways() {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["payment-gateways", organizationId],
    queryFn: () => PaymentGatewayService.list(organizationId as string),
    enabled: Boolean(organizationId),
  });
}

export function useCreateGateway() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: (data: {
      provider: PaymentGatewayProvider;
      label: string;
      enabled?: boolean;
      credentials?: string;
      settings?: Record<string, unknown>;
    }) => PaymentGatewayService.create(organizationId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateways", organizationId] });
      toast.success("Gateway criado com sucesso.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useUpdateGateway() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({
      gatewayId,
      data,
    }: {
      gatewayId: string;
      data: { label?: string; enabled?: boolean; credentials?: string; settings?: Record<string, unknown> };
    }) => PaymentGatewayService.update(gatewayId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateways", organizationId] });
      toast.success("Gateway atualizado.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useDeleteGateway() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: (gatewayId: string) => PaymentGatewayService.delete(gatewayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-gateways", organizationId] });
      toast.success("Gateway removido.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}
