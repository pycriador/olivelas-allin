import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/hooks/useTenant";
import { SaleService } from "@/services/sales";
import type { PaymentMethod } from "@/services/types";
import { describeError } from "@/services/types";

export function useSales(
  campaignId: string | undefined,
  filters?: { search?: string; limit?: number; offset?: number },
) {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["sales", organizationId, campaignId, filters],
    queryFn: () => SaleService.list(campaignId as string, filters),
    enabled: Boolean(organizationId && campaignId),
  });
}

export function useSalesMetrics(campaignId: string | undefined) {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["sales-metrics", organizationId, campaignId],
    queryFn: () => SaleService.metrics(campaignId as string),
    enabled: Boolean(organizationId && campaignId),
  });
}

export function useQuickSale() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string;
      data: {
        name: string;
        phone: string;
        numbers: number[];
        payment_method?: PaymentMethod;
        notes?: string;
      };
    }) => SaleService.quickSale(campaignId, data),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["sales", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["sales-metrics", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["participants", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-numbers", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-number-metrics", organizationId, campaignId] });
      toast.success("Venda registrada com sucesso!");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string;
      data: {
        participant_id: string;
        numbers: number[];
        payment_method?: PaymentMethod;
        amount?: number;
        notes?: string;
      };
    }) => SaleService.createSale(campaignId, data),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["sales", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["sales-metrics", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-numbers", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-number-metrics", organizationId, campaignId] });
      toast.success("Venda registrada com sucesso!");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({
      saleId,
      campaignId,
      data,
    }: {
      saleId: string;
      campaignId: string;
      data: {
        add_numbers?: number[];
        remove_numbers?: number[];
        payment_method?: PaymentMethod;
        amount?: number;
        notes?: string;
      };
    }) => SaleService.updateSale(saleId, data),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["sales", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["sales-metrics", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-numbers", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-number-metrics", organizationId, campaignId] });
      toast.success("Venda atualizada.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useCancelSale() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({ saleId, campaignId }: { saleId: string; campaignId: string }) =>
      SaleService.cancel(saleId),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["sales", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["sales-metrics", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-numbers", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-number-metrics", organizationId, campaignId] });
      toast.success("Venda cancelada. Números devolvidos ao estoque.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useTransferSale() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({
      saleId,
      campaignId,
      toParticipantId,
      numbers,
    }: {
      saleId: string;
      campaignId: string;
      toParticipantId: string;
      numbers: number[];
    }) => SaleService.transfer(saleId, toParticipantId, numbers),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["sales", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["sales-metrics", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["participants", organizationId, campaignId] });
      toast.success("Números transferidos com sucesso.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useExportSalesCsv() {
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: (campaignId: string) => SaleService.exportCsv(campaignId),
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vendas.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}
