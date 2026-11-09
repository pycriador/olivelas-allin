import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { storageService, type FileListParams } from "@/services/storage.service";
import type { StorageFile } from "@/types/storage";

export function useFiles(params: FileListParams) {
  return useQuery({
    queryKey: ["files", params],
    queryFn: () => storageService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useFileCount() {
  return useQuery({ queryKey: ["files", "count"], queryFn: () => storageService.count() });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: StorageFile) => storageService.remove(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["files"] });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
