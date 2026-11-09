import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { settingsService } from "@/services/settings.service";
import type { SettingValue } from "@/types/settings";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.list(),
    staleTime: 30_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      updates: { id: string; key: string; value: SettingValue }[];
      previous: Record<string, SettingValue>;
    }) => settingsService.updateMany(input.updates, input.previous),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
