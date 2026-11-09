import { useMutation, useQueryClient } from "@tanstack/react-query";

import { profileService } from "@/services/profile.service";
import type { UpdateProfileInput } from "@/schemas/profile.schema";

export function useUpdateProfile(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => {
      if (!userId) throw new Error("Usuário não autenticado");
      return profileService.update(userId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}
