import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/hooks/useTenant";
import { ParticipantService } from "@/services/participants";
import { describeError } from "@/services/types";

export function useParticipants(
  campaignId: string | undefined,
  filters?: { search?: string; limit?: number; offset?: number },
) {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["participants", organizationId, campaignId, filters],
    queryFn: () => ParticipantService.list(campaignId as string, filters),
    enabled: Boolean(organizationId && campaignId),
  });
}

export function useCreateParticipant() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({
      campaignId,
      data,
    }: {
      campaignId: string;
      data: { name: string; phone?: string; email?: string; document?: string; notes?: string };
    }) => ParticipantService.create(campaignId, data),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["participants", organizationId, campaignId] });
      toast.success("Participante criado com sucesso.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient();
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: ({
      participantId,
      campaignId,
      data,
    }: {
      participantId: string;
      campaignId: string;
      data: { name?: string; phone?: string; email?: string; document?: string; notes?: string };
    }) => ParticipantService.update(participantId, data),
    onSuccess: (_data, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["participants", organizationId, campaignId] });
      toast.success("Participante atualizado.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useParticipantHistory(participantId: string | undefined) {
  return useQuery({
    queryKey: ["participant-history", participantId],
    queryFn: () => ParticipantService.history(participantId as string),
    enabled: Boolean(participantId),
  });
}

export function useExportParticipantsCsv() {
  const { organizationId } = useTenant();

  return useMutation({
    mutationFn: (campaignId: string) => ParticipantService.exportCsv(campaignId),
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "participantes.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}
