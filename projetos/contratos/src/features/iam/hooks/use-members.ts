import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { profileService, roleService } from "@/services/workspace";
import { auditService } from "@/services/audit";
import { useWorkspaceStore } from "@/stores/workspace";
import { toast } from "sonner";

export function useWorkspaceMembers() {
  const workspaceId = useWorkspaceStore((s) => s.workspace?.id);
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["iam", "members", workspaceId],
    queryFn: () => profileService.listByWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });

  const { data: roles } = useQuery({
    queryKey: ["iam", "roles"],
    queryFn: () => roleService.listAll(),
  });

  const { data: permissions } = useQuery({
    queryKey: ["iam", "permissions"],
    queryFn: () => roleService.listPermissions(),
  });

  const inviteMember = useMutation({
    mutationFn: async ({
      email,
      role,
      workspaceId: wsId,
    }: {
      email: string;
      role: string;
      workspaceId: string;
    }) => {
      await auditService.record({
        workspaceId: wsId,
        action: "invitation",
        entity: "users",
        metadata: { email, role },
      });
      return { email, role };
    },
    onSuccess: () => {
      toast.success(
        "Convite registrado. A criação de usuários será habilitada nas próximas sprints.",
      );
      queryClient.invalidateQueries({ queryKey: ["iam", "members"] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar convite");
    },
  });

  return { members, roles, permissions, isLoading, inviteMember };
}
