import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTenant } from "@/hooks/useTenant";
import { CampaignImageService, CampaignService, type CampaignFilters, type CampaignInput } from "@/services/campaigns";
import type { Campaign, CampaignImage, CampaignMetrics, CampaignStatus } from "@/services/types";
import { describeError } from "@/services/types";

export function useCampaignList(filters: CampaignFilters = {}) {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["campaigns", organizationId, filters],
    queryFn: () => CampaignService.list(organizationId as string, filters),
    enabled: Boolean(organizationId),
  });
}

export function useCampaignMetrics() {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["campaign-metrics", organizationId],
    queryFn: () => CampaignService.metrics(organizationId as string),
    enabled: Boolean(organizationId),
  });
}

export function useCampaign(campaignId: string | undefined) {
  const { organizationId } = useTenant();

  return useQuery({
    queryKey: ["campaign", organizationId, campaignId],
    queryFn: () => CampaignService.get(organizationId as string, campaignId as string),
    enabled: Boolean(organizationId && campaignId),
  });
}

export function useCampaignImages(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["campaign-images", campaignId],
    queryFn: () => CampaignImageService.list(campaignId as string),
    enabled: Boolean(campaignId),
  });
}

export function useCreateCampaign() {
  const { organizationId } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CampaignInput) => CampaignService.create(organizationId as string, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-metrics", organizationId] });
      toast.success("Campanha criada com sucesso.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useUpdateCampaign() {
  const { organizationId } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, patch }: { campaignId: string; patch: Partial<CampaignInput> & { clear_start_at?: boolean; clear_end_at?: boolean } }) =>
      CampaignService.update(campaignId, patch),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["campaign", organizationId, variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-metrics", organizationId] });
      toast.success("Campanha atualizada.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useSetCampaignStatus() {
  const { organizationId } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, status }: { campaignId: string; status: CampaignStatus }) =>
      CampaignService.setStatus(campaignId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["campaign", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-metrics", organizationId] });
      toast.success("Situação da campanha alterada.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useUploadCampaignImage() {
  const { organizationId } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, file, asCover }: { campaignId: string; file: File; asCover?: boolean }) =>
      CampaignImageService.upload({ organizationId: organizationId as string, campaignId, file, ...(asCover !== undefined ? { asCover } : {}) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-images", variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign", organizationId, variables.campaignId] });
      toast.success("Imagem enviada.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useDeleteCampaignImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, campaignId }: { imageId: string; campaignId: string }) =>
      CampaignImageService.remove(imageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-images", variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      toast.success("Imagem removida.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useSetCover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, campaignId }: { imageId: string; campaignId: string }) =>
      CampaignImageService.setCover(imageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-images", variables.campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      toast.success("Capa definida.");
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

export function useReorderImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, imageIds }: { campaignId: string; imageIds: string[] }) =>
      CampaignImageService.reorder(campaignId, imageIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-images", variables.campaignId] });
    },
    onError: (error) => {
      toast.error(describeError(error));
    },
  });
}

import { PublicCampaignService } from "@/services/campaigns";
import type { PublicCampaignView } from "@/services/types";

export function usePublicCampaign(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-campaign", slug],
    queryFn: () => PublicCampaignService.bySlug(slug as string),
    enabled: Boolean(slug),
    retry: false,
  });
}
