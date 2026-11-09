import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { campaignService } from "@/services/campaign.service";
import { setCampaignFeaturedAdminFn } from "@/lib/campaigns/campaign-admin.server";
import type {
  CampaignFormInput,
  CampaignSettingsInput,
  CampaignWhatsAppMessageInput,
} from "@/schemas/campaign.schema";
import type { CampaignFilters, CampaignPublishStatus, CampaignStatus } from "@/types/campaign";

export interface CampaignListParams {
  page: number;
  pageSize: number;
  filters?: CampaignFilters;
}

export function useCampaigns(params: CampaignListParams) {
  return useQuery({
    queryKey: ["campaigns", "list", params],
    queryFn: () => campaignService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useCampaign(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["campaigns", campaignId],
    queryFn: () => (campaignId ? campaignService.getById(campaignId) : null),
    enabled: Boolean(campaignId),
  });
}

export function useCampaignMetrics(createdBy?: string) {
  return useQuery({
    queryKey: ["campaigns", "metrics", createdBy ?? "all"],
    queryFn: () => campaignService.metrics(createdBy),
    staleTime: 30_000,
  });
}

export function useDeletedCampaigns(createdBy?: string) {
  return useQuery({
    queryKey: ["campaigns", "deleted", createdBy ?? "all"],
    queryFn: () => campaignService.listDeleted(createdBy),
    staleTime: 30_000,
  });
}

function useInvalidateCampaigns() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    void queryClient.invalidateQueries({ queryKey: ["audit"] });
  };
}

export function useCreateCampaign() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: CampaignFormInput) => campaignService.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateCampaign() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: { campaignId: string; data: CampaignFormInput }) =>
      campaignService.update(input.campaignId, input.data),
    onSuccess: invalidate,
  });
}

export function useUpdateCampaignStatus() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: { campaignId: string; status: CampaignStatus }) =>
      campaignService.updateStatus(input.campaignId, input.status),
    onSuccess: invalidate,
  });
}

export function useDuplicateCampaign() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (campaignId: string) => campaignService.duplicate(campaignId),
    onSuccess: invalidate,
  });
}

export function useDeleteCampaign() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (campaignId: string) => campaignService.softDelete(campaignId),
    onSuccess: invalidate,
  });
}

export function useRestoreCampaign() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (campaignId: string) => campaignService.restore(campaignId),
    onSuccess: invalidate,
  });
}

export function useEmptyTrash() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (campaignIds: string[]) =>
      Promise.all(campaignIds.map((id) => campaignService.permanentDelete(id))),
    onSuccess: invalidate,
  });
}

export function useUpdateCampaignSettings() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: { campaignId: string; data: CampaignSettingsInput }) =>
      campaignService.updateSettings(input.campaignId, input.data),
    onSuccess: invalidate,
  });
}

export function useSetCampaignFeatured() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: { campaignId: string; featured: boolean }) =>
      setCampaignFeaturedAdminFn({ data: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateCampaignPublishStatus() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: { campaignId: string; status: CampaignPublishStatus }) =>
      campaignService.updatePublishStatus(input.campaignId, input.status),
    onSuccess: invalidate,
  });
}

export function useUploadCampaignImages() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: { campaignId: string; files: File[] }) =>
      campaignService.uploadImages(input.campaignId, input.files),
    onSuccess: invalidate,
  });
}

export function useSetCampaignCover() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: { campaignId: string; imageId: string }) =>
      campaignService.setCover(input.campaignId, input.imageId),
    onSuccess: invalidate,
  });
}

export function useRemoveCampaignImage() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: { campaignId: string; imageId: string }) =>
      campaignService.removeImage(input.campaignId, input.imageId),
    onSuccess: invalidate,
  });
}

export function useReorderCampaignImages() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: { campaignId: string; orderedIds: string[] }) =>
      campaignService.reorderImages(input.campaignId, input.orderedIds),
    onSuccess: invalidate,
  });
}

export function useCampaignWhatsAppMessages(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["campaigns", "whatsapp-messages", campaignId],
    queryFn: () => (campaignId ? campaignService.listWhatsAppMessages(campaignId) : []),
    enabled: Boolean(campaignId),
  });
}

function useInvalidateWhatsAppMessages(campaignId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: ["campaigns", "whatsapp-messages", campaignId],
    });
    void queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId] });
  };
}

export function useCreateCampaignWhatsAppMessage(campaignId: string) {
  const invalidate = useInvalidateWhatsAppMessages(campaignId);
  return useMutation({
    mutationFn: (input: CampaignWhatsAppMessageInput) =>
      campaignService.createWhatsAppMessage(campaignId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateCampaignWhatsAppMessage(campaignId: string) {
  const invalidate = useInvalidateWhatsAppMessages(campaignId);
  return useMutation({
    mutationFn: (input: { messageId: string; data: CampaignWhatsAppMessageInput }) =>
      campaignService.updateWhatsAppMessage(input.messageId, input.data),
    onSuccess: invalidate,
  });
}

export function useDeleteCampaignWhatsAppMessage(campaignId: string) {
  const invalidate = useInvalidateWhatsAppMessages(campaignId);
  return useMutation({
    mutationFn: (messageId: string) => campaignService.deleteWhatsAppMessage(messageId),
    onSuccess: invalidate,
  });
}

export function useSetDefaultCampaignWhatsAppMessage(campaignId: string) {
  const invalidate = useInvalidateWhatsAppMessages(campaignId);
  return useMutation({
    mutationFn: (messageId: string) =>
      campaignService.setDefaultWhatsAppMessage(campaignId, messageId),
    onSuccess: invalidate,
  });
}
