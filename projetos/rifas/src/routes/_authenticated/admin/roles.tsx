import { createFileRoute } from "@tanstack/react-router";
import { Shield, ShieldCheck, Users, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { useResolvedRolePermissions, useSetPermission } from "@/hooks/use-iam";
import { ROLE_LABELS, type RoleCode } from "@/types/profile";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  head: () => ({ meta: [{ title: "Roles — Admin — RaffleHub" }] }),
  component: AdminRolesPage,
});

const ROLES: RoleCode[] = ["GLOBAL_ADMIN", "ADMIN", "PUBLISHER"];

const RESOURCE_GROUPS: { label: string; prefix: string }[] = [
  { label: "Dashboard", prefix: "dashboard" },
  { label: "Usuarios", prefix: "users" },
  { label: "Campanhas", prefix: "campaigns" },
  { label: "Arquivos", prefix: "files" },
  { label: "Auditoria", prefix: "audit" },
  { label: "Configuracoes", prefix: "settings" },
  { label: "Pagamentos", prefix: "payments" },
  { label: "Relatorios", prefix: "reports" },
  { label: "Clientes", prefix: "customers" },
  { label: "Pedidos", prefix: "orders" },
  { label: "Notificacoes", prefix: "notifications" },
];

function groupPermissions() {
  return RESOURCE_GROUPS.map((g) => ({
    group: g.prefix,
    label: g.label,
    perms: PERMISSIONS.filter((p) => p.startsWith(`${g.prefix}.`)),
  })).filter((g) => g.perms.length > 0);
}

const ROLE_CONFIG: Record<
  RoleCode,
  { icon: React.ComponentType<{ className?: string }>; color: string; description: string }
> = {
  GLOBAL_ADMIN: {
    icon: Shield,
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    description:
      "Acesso administrativo completo. Gerencia usuarios, roles, permissoes e configuracoes globais.",
  },
  ADMIN: {
    icon: ShieldCheck,
    color: "text-primary bg-primary/10",
    description:
      "Administrador operacional. Gerencia usuarios, campanhas, pagamentos e recursos permitidos.",
  },
  PUBLISHER: {
    icon: UserIcon,
    color: "text-muted-foreground bg-muted",
    description: "Criador de campanhas. Gerencia suas proprias campanhas, midias e artes.",
  },
};

function AdminRolesPage() {
  const { isGlobalAdmin } = usePermissions();
  const resolved = useResolvedRolePermissions();
  const setPermission = useSetPermission();

  const { data: roleCounts, isLoading } = useQuery({
    queryKey: ["admin", "roleCounts"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase.from("roles").select("id, code");
      if (rolesErr) throw rolesErr;

      const counts: Record<string, number> = {};
      for (const r of roles ?? []) {
        const { count, error: countErr } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role_id", r.id)
          .is("deleted_at", null);
        if (!countErr) counts[r.code] = count ?? 0;
      }
      return counts;
    },
    staleTime: 30_000,
  });

  function handleToggle(role: RoleCode, perm: Permission, granted: boolean) {
    setPermission.mutate(
      { role, permission: perm, granted },
      {
        onSuccess: () => toast.success(granted ? "Permissao concedida." : "Permissao revogada."),
        onError: (err: Error) =>
          toast.error("Falha ao atualizar permissao", { description: err.message }),
      },
    );
  }

  const groups = groupPermissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles e Permissoes</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as funcoes da plataforma e a matriz de permissoes por role. As alteracoes sao
          salvas no banco de dados.
          {isGlobalAdmin ? "" : " — Apenas Global Admin pode editar permissoes."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? ROLES.map((code) => <Skeleton key={code} className="h-48 w-full rounded-lg" />)
          : ROLES.map((code) => {
              const config = ROLE_CONFIG[code];
              const permCount = resolved[code].size;
              const userCount = roleCounts?.[code] ?? 0;
              const Icon = config.icon;
              return (
                <Card key={code} className="group transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${config.color}`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="text-base">{ROLE_LABELS[code]}</CardTitle>
                        <p className="text-xs font-mono text-muted-foreground">{code}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                    <div className="flex gap-3 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">{userCount}</span>
                        <span className="text-muted-foreground">usuarios</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Shield className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">{permCount}</span>
                        <span className="text-muted-foreground">permissoes</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Matriz editavel */}
      {groups.map((g) => (
        <Card key={g.group}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4 text-muted-foreground" />
              {g.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                      Permissao
                    </th>
                    {ROLES.map((r) => (
                      <th
                        key={r}
                        className="px-4 py-2 text-center text-xs font-medium text-muted-foreground"
                      >
                        {ROLE_LABELS[r]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.perms.map((perm) => (
                    <tr key={perm} className="border-b transition-colors hover:bg-muted/30">
                      <td className="px-4 py-2">
                        <code className="text-xs">{perm}</code>
                      </td>
                      {ROLES.map((r) => {
                        const checked = resolved[r].has(perm);
                        const locked = r === "GLOBAL_ADMIN";
                        const editable = isGlobalAdmin && !locked;
                        return (
                          <td key={r} className="px-4 py-2 text-center">
                            <Switch
                              checked={checked}
                              disabled={!editable || setPermission.isPending}
                              onCheckedChange={(granted) => handleToggle(r, perm, granted)}
                              aria-label={`${perm} para ${ROLE_LABELS[r]}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
