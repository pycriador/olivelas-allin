import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { userService, type UserListParams } from "@/services/user.service";
import type { ProfileStatus, RoleCode } from "@/types/profile";

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => userService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useUserCounts() {
  return useQuery({ queryKey: ["users", "counts"], queryFn: () => userService.counts() });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["users"] });
    void queryClient.invalidateQueries({ queryKey: ["audit"] });
  };
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: {
      userId: string;
      name: string;
      avatar_url: string | null;
      previous?: { name: string; avatar_url: string | null };
    }) =>
      userService.update(
        input.userId,
        { name: input.name, avatar_url: input.avatar_url },
        input.previous,
      ),
    onSuccess: invalidate,
  });
}

export function useSetUserStatus() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: { userId: string; status: ProfileStatus }) =>
      userService.setStatus(input.userId, input.status),
    onSuccess: invalidate,
  });
}

export function useSetUserRole() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: { userId: string; role: RoleCode }) =>
      userService.setRole(input.userId, input.role),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (userId: string) => userService.softDelete(userId),
    onSuccess: invalidate,
  });
}

export function useRestoreUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (userId: string) => userService.restore(userId),
    onSuccess: invalidate,
  });
}
