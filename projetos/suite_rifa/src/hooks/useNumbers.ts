import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/hooks/useTenant";
import { CampaignNumberService, ReservationService } from "@/services/numbers";
import { describeError } from "@/services/types";

export function useCampaignNumbers(
  campaignId: string | undefined,
  filters?: { status?: string; search?: string; limit?: number; offset?: number },
) {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["campaign-numbers", organizationId, campaignId, filters],
    queryFn: () => CampaignNumberService.list(campaignId as string, filters),
    enabled: Boolean(organizationId && campaignId),
  });
}

export function useCampaignNumberMetrics(campaignId: string | undefined) {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["campaign-number-metrics", organizationId, campaignId],
    queryFn: () => CampaignNumberService.metrics(campaignId as string),
    enabled: Boolean(organizationId && campaignId),
  });
}

export function usePublicCampaignNumbers(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-campaign-numbers", slug],
    queryFn: () => CampaignNumberService.publicNumbers(slug as string),
    enabled: Boolean(slug),
  });
}

export function useGenerateNumbers() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: (campaignId: string) => CampaignNumberService.generate(campaignId),
    onSuccess: (_data, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-numbers", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-number-metrics", organizationId, campaignId] });
      toast.success("Números gerados com sucesso.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useBlockNumbers() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({ campaignId, numbers }: { campaignId: string; numbers: number[] }) =>
      CampaignNumberService.blockNumbers(campaignId, numbers),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-numbers", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-number-metrics", organizationId, campaignId] });
      toast.success("Números bloqueados.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useUnblockNumbers() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({ campaignId, numbers }: { campaignId: string; numbers: number[] }) =>
      CampaignNumberService.unblockNumbers(campaignId, numbers),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-numbers", organizationId, campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-number-metrics", organizationId, campaignId] });
      toast.success("Números desbloqueados.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useActiveReservation(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["active-reservation", campaignId],
    queryFn: () => ReservationService.getActive(campaignId as string),
    enabled: Boolean(campaignId),
    refetchInterval: 30_000,
  });
}

export function useReserveNumbers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, numbers }: { campaignId: string; numbers: number[] }) =>
      ReservationService.reserve(campaignId, numbers),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["active-reservation", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["public-campaign-numbers"] });
      toast.success("Números reservados com sucesso!");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) => ReservationService.cancel(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-reservation"] });
      queryClient.invalidateQueries({ queryKey: ["public-campaign-numbers"] });
      toast.success("Reserva cancelada.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useListCampaignNumbersWithParticipant(
  campaignId: string | undefined,
  filters?: { status?: string; search?: string; limit?: number; offset?: number },
) {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["campaign-numbers-participant", organizationId, campaignId, filters],
    queryFn: () => CampaignNumberService.listWithParticipant(campaignId as string, filters),
    enabled: Boolean(organizationId && campaignId),
  });
}
