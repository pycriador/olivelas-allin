import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { settingsRepo } from "@/lib/repositories/settings";

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.root,
    queryFn: () => settingsRepo.get(),
    staleTime: 30_000,
  });
}
