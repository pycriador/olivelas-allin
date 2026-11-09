import { useQuery } from "@tanstack/react-query";
import { Shield, KeyRound } from "lucide-react";
import { roleService } from "@/services/workspace";
import { supabase } from "@/integrations/supabase/client";
import type { Permission } from "@/types";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: "Acesso total à plataforma e a todos os workspaces.",
  workspace_admin: "Administra o workspace e seus módulos.",
  manager: "Gerencia projetos, biblioteca e usuários.",
  editor: "Cria e edita projetos e documentos.",
  reviewer: "Revisa e valida documentos gerados.",
  viewer: "Acesso somente leitura.",
};

const MODULE_LABEL: Record<string, string> = {
  Workspace: "Workspace",
  Projects: "Projects",
  Documents: "Documents",
  Executions: "Executions",
  Libraries: "Libraries",
  Users: "Users",
  Settings: "Settings",
  Audit: "Audit",
  Connectors: "Connectors",
  Validation: "Validation",
};

export function RolesPage() {
  const { data: permissions, isLoading: permLoading } = useQuery({
    queryKey: ["iam", "permissions"],
    queryFn: () => roleService.listPermissions(),
  });

  const { data: rolePermissions, isLoading: rpLoading } = useQuery({
    queryKey: ["iam", "role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role, permission_key");
      if (error) throw error;
      const map = new Map<string, Set<string>>();
      for (const row of data) {
        const set = map.get(row.role) ?? new Set<string>();
        set.add(row.permission_key);
        map.set(row.role, set);
      }
      return map;
    },
  });

  const roles = ["super_admin", "workspace_admin", "manager", "editor", "reviewer", "viewer"];

  const groupedPermissions = (permissions ?? []).reduce<Record<string, Permission[]>>((acc, p) => {
    const group = acc[p.module] ?? [];
    group.push(p);
    acc[p.module] = group;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Papéis e permissões"
        description="Entenda o modelo RBAC e as permissões disponíveis por módulo."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4 text-muted-foreground" />
              Papéis (RBAC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {roles.map((role) => {
                const permissionCount = rolePermissions?.get(role)?.size ?? 0;
                return (
                  <div key={role} className="flex items-start gap-3 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Shield className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium capitalize">{role.replace("_", " ")}</p>
                        <Badge variant="secondary">{permissionCount} permissões</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {ROLE_DESCRIPTIONS[role] ?? ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4 text-muted-foreground" />
              Permissões por módulo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {permLoading || rpLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="Workspace">
                <TabsList className="flex h-auto flex-wrap justify-start gap-1">
                  {Object.keys(groupedPermissions).map((module) => (
                    <TabsTrigger key={module} value={module} className="text-xs">
                      {MODULE_LABEL[module] ?? module}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <TabsContent key={module} value={module} className="mt-4 space-y-2">
                    {perms.map((perm) => (
                      <div
                        key={perm.key}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs">{perm.key}</p>
                          {perm.description && (
                            <p className="truncate text-xs text-muted-foreground">
                              {perm.description}
                            </p>
                          )}
                        </div>
                        <RolesWithPermission
                          permissionKey={perm.key}
                          rolePermissions={rolePermissions}
                        />
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RolesWithPermission({
  permissionKey,
  rolePermissions,
}: {
  permissionKey: string;
  rolePermissions?: Map<string, Set<string>> | undefined;
}) {
  if (!rolePermissions) return null;
  const roles = Array.from(rolePermissions.entries())
    .filter(([, perms]) => perms.has(permissionKey))
    .map(([role]) => role);
  if (roles.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {roles.slice(0, 3).map((role) => (
        <Badge key={role} variant="secondary" className="text-[10px] capitalize">
          {role.replace("_", " ")}
        </Badge>
      ))}
      {roles.length > 3 && (
        <Badge variant="outline" className="text-[10px]">
          +{roles.length - 3}
        </Badge>
      )}
    </div>
  );
}
