import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Users, UsersRound, Layers, Send, ClipboardList, ShieldCheck } from "lucide-react";

export function AdminDashboardTab() {
  const { t } = useTranslation();
  const { org } = useCurrentOrg();
  const orgId = org?.id;

  const stats = useQuery({
    queryKey: ["admin-stats", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [members, workspaces, groups, invitations, roles, audit] = await Promise.all([
        supabase
          .from("organization_members")
          .select("user_id", { count: "exact", head: true })
          .eq("organization_id", orgId!),
        supabase
          .from("workspaces")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!),
        supabase
          .from("groups")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!),
        supabase
          .from("invitations")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!)
          .eq("status", "pending"),
        supabase.from("user_roles").select("role").eq("organization_id", orgId!),
        supabase
          .from("audit_logs")
          .select("id, action, resource, created_at, user_id")
          .eq("organization_id", orgId!)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      const byRole = new Map<string, number>();
      roles.data?.forEach((r) => byRole.set(r.role, (byRole.get(r.role) ?? 0) + 1));
      return {
        members: members.count ?? 0,
        workspaces: workspaces.count ?? 0,
        groups: groups.count ?? 0,
        invitations: invitations.count ?? 0,
        byRole: [...byRole.entries()],
        recentAudit: audit.data ?? [],
      };
    },
  });

  const kpis = [
    { icon: Users, label: t("admin.kpis.members"), value: stats.data?.members ?? "-" },
    { icon: Layers, label: t("admin.kpis.workspaces"), value: stats.data?.workspaces ?? "-" },
    { icon: UsersRound, label: t("admin.kpis.groups"), value: stats.data?.groups ?? "-" },
    { icon: Send, label: t("admin.kpis.pendingInvites"), value: stats.data?.invitations ?? "-" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              {t("admin.kpis.byRole")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.data?.byRole.length ? (
              stats.data.byRole.map(([role, count]) => (
                <div key={role} className="flex items-center justify-between rounded-md border p-2">
                  <Badge variant="secondary" className="capitalize">
                    {role}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              {t("admin.kpis.recentAudit")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.data?.recentAudit.length ? (
              stats.data.recentAudit.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <span className="font-medium">{a.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
