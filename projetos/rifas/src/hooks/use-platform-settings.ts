import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { platformSettingsService } from "@/services/platform-settings.service";
import type { PlatformSettingsInput } from "@/schemas/platform-settings.schema";

export function usePlatformSettings() {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: () => platformSettingsService.get(),
    staleTime: 60_000,
  });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; data: PlatformSettingsInput }) =>
      platformSettingsService.update(input.id, input.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
