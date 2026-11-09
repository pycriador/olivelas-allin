import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { orderService } from "@/services/order.service";
import type { OrderListParams, OrderStatus, PaymentMethod } from "@/types/order";

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: ["orders", "list", params],
    queryFn: () => orderService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => (orderId ? orderService.getById(orderId) : null),
    enabled: Boolean(orderId),
  });
}

export function useOrderMetrics(createdBy?: string) {
  return useQuery({
    queryKey: ["orders", "metrics", createdBy ?? "all"],
    queryFn: () => orderService.metrics(createdBy),
    staleTime: 30_000,
  });
}

/** Invalida pedidos, números (grade) e campanhas após mutações de pedido. */
function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
    void queryClient.invalidateQueries({ queryKey: ["campaign-numbers"] });
    void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["audit"] });
  };
}

/** Realtime: mantém as listas de pedidos atualizadas ao vivo. */
export function useRealtimeOrders(campaignId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!campaignId) return;
    const channel = supabase
      .channel(`campaign-orders:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["orders"] });
          void queryClient.invalidateQueries({ queryKey: ["campaign-numbers"] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [campaignId, queryClient]);
}

export function useCreateManualOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: async (input: {
      campaignId: string;
      customerId: string | null;
      paymentMethod: PaymentMethod | null;
      discount: number;
      notes: string;
      numbers: number[];
      initialStatus?: "PAID" | "WAITING_PAYMENT" | null;
    }) => {
      return orderService.createManual({
        campaignId: input.campaignId,
        customerId: input.customerId,
        paymentMethod: input.paymentMethod,
        discount: input.discount,
        notes: input.notes,
        numbers: input.numbers,
        ...(input.initialStatus ? { initialStatus: input.initialStatus } : {}),
      });
    },
    onSuccess: invalidate,
  });
}

export function useAddOrderNumbers() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (input: { orderId: string; numbers: number[] }) =>
      orderService.addNumbers(input.orderId, input.numbers),
    onSuccess: invalidate,
  });
}

export function useRemoveOrderNumbers() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (input: { orderId: string; numbers: number[] }) =>
      orderService.removeNumbers(input.orderId, input.numbers),
    onSuccess: invalidate,
  });
}

export function useSwapOrderNumber() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (input: { orderId: string; oldNumber: number; newNumber: number }) =>
      orderService.swapNumber(input.orderId, input.oldNumber, input.newNumber),
    onSuccess: invalidate,
  });
}

export function useSetOrderStatus() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (input: { orderId: string; status: OrderStatus }) =>
      orderService.setStatus(input.orderId, input.status),
    onSuccess: invalidate,
  });
}

export function useImportSoldNumbers() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (input: {
      campaignId: string;
      customerId: string | null;
      paymentMethod: PaymentMethod | null;
      notes: string;
      numbers: number[];
    }) => orderService.importSoldNumbers(input),
    onSuccess: invalidate,
  });
}

export function useUploadReceipt() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (input: { orderId: string; file: File }) =>
      orderService.uploadReceipt(input.orderId, input.file),
    onSuccess: invalidate,
  });
}

export function useDeleteOrder() {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (orderId: string) => orderService.deleteOrder(orderId),
    onSuccess: invalidate,
  });
}
