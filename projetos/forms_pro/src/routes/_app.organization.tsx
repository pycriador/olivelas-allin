import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Loader2, Mail, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrgGuard } from "@/components/org/org-guard";
import { useOrgStore } from "@/stores/org-store";
import {
  invitationsApi,
  limitsApi,
  membersApi,
  organizationsApi,
} from "@/services/org-service";
import { ALL_ORG_PERMISSIONS, ORG_ROLES, type OrgRole } from "@/types/org";

export const Route = createFileRoute("/_app/organization")({
  head: () => ({
    meta: [
      { title: "Organização — IAM Pro Forms" },
      { name: "description", content: "Gerencie dados da empresa, membros, papéis, convites e limites do plano." },
      { property: "og:title", content: "Organização — IAM Pro Forms" },
      { property: "og:description", content: "Multi-tenant enterprise: membros, papéis, convites e limites." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <OrgGuard>{(orgId) => <OrganizationPage organizationId={orgId} />}</OrgGuard>
  ),
});

function OrganizationPage({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("org.settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("org.settings.subtitle")}</p>
      </div>
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">{t("org.settings.tabs.general")}</TabsTrigger>
          <TabsTrigger value="members">{t("org.settings.tabs.members")}</TabsTrigger>
          <TabsTrigger value="invitations">{t("org.settings.tabs.invitations")}</TabsTrigger>
          <TabsTrigger value="roles">{t("org.settings.tabs.roles")}</TabsTrigger>
          <TabsTrigger value="limits">{t("org.settings.tabs.limits")}</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-5">
          <GeneralTab organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="members" className="mt-5">
          <MembersTab organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="invitations" className="mt-5">
          <InvitationsTab organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="roles" className="mt-5">
          <RolesTab />
        </TabsContent>
        <TabsContent value="limits" className="mt-5">
          <LimitsTab organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralTab({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const { can, reload } = useOrgStore();
  const editable = can("manage_organization");
  const q = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: () => organizationsApi.get(organizationId),
  });
  const [form, setForm] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: () =>
      organizationsApi.update(organizationId, {
        name: form["name"] ?? q.data?.name,
        legalName: form["legalName"] ?? q.data?.legalName,
        responseRetentionDays: Number(form["responseRetentionDays"] ?? q.data?.responseRetentionDays),
        auditRetentionDays: Number(form["auditRetentionDays"] ?? q.data?.auditRetentionDays),
      }),
    onSuccess: async () => {
      toast.success(t("org.settings.general.saved"));
      await reload();
      await q.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading || !q.data) return <Skeleton className="h-64 w-full" />;
  const org = q.data;
  const value = (key: string, fallback: string | number) => form[key] ?? String(fallback);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("org.settings.general.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("org.create.name")}</Label>
          <Input
            value={value("name", org.name)}
            disabled={!editable}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("org.create.legalName")}</Label>
          <Input
            value={value("legalName", org.legalName)}
            disabled={!editable}
            onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("org.settings.general.slug")}</Label>
          <Input value={org.slug} readOnly disabled />
        </div>
        <div className="space-y-1.5">
          <Label>{t("org.settings.general.plan")}</Label>
          <Input value={org.plan} readOnly disabled />
        </div>
        <div className="space-y-1.5">
          <Label>{t("org.settings.general.retentionResponses")}</Label>
          <Input
            type="number"
            value={value("responseRetentionDays", org.responseRetentionDays)}
            disabled={!editable}
            onChange={(e) => setForm((f) => ({ ...f, responseRetentionDays: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("org.settings.general.retentionAudit")}</Label>
          <Input
            type="number"
            value={value("auditRetentionDays", org.auditRetentionDays)}
            disabled={!editable}
            onChange={(e) => setForm((f) => ({ ...f, auditRetentionDays: e.target.value }))}
          />
        </div>
        {editable && (
          <div className="md:col-span-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MembersTab({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const canManage = useOrgStore((s) => s.permissions.includes("manage_members"));
  const q = useQuery({
    queryKey: ["org-members", organizationId],
    queryFn: () => membersApi.list(organizationId),
  });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: OrgRole }) => membersApi.setRole(id, role),
    onSuccess: () => {
      toast.success(t("org.members.updated"));
      qc.invalidateQueries({ queryKey: ["org-members", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => membersApi.remove(id),
    onSuccess: () => {
      toast.success(t("org.members.removed"));
      qc.invalidateQueries({ queryKey: ["org-members", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("org.members.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("org.members.subtitle")}</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {q.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !q.data?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("org.members.empty")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-4 font-medium">{t("common.name")}</th>
                <th className="py-2 pr-4 font-medium">{t("common.email")}</th>
                <th className="py-2 pr-4 font-medium">{t("org.members.role")}</th>
                <th className="py-2 pr-4 font-medium">{t("org.members.status")}</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {q.data.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{m.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{m.email}</td>
                  <td className="py-3 pr-4">
                    <Select
                      value={m.role}
                      disabled={!canManage || setRole.isPending}
                      onValueChange={(role) => setRole.mutate({ id: m.id, role: role as OrgRole })}
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {t(`roleLabels.${r}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge>
                  </td>
                  <td className="py-3 text-right">
                    {canManage && m.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove.mutate(m.id)}
                        aria-label={t("org.members.remove")}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function InvitationsTab({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const canManage = useOrgStore((s) => s.permissions.includes("manage_members"));
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("editor");

  const q = useQuery({
    queryKey: ["org-invites", organizationId],
    queryFn: () => invitationsApi.list(organizationId),
  });

  const invite = useMutation({
    mutationFn: () => invitationsApi.create(organizationId, email, role),
    onSuccess: () => {
      toast.success(t("org.invitations.sent"));
      setEmail("");
      qc.invalidateQueries({ queryKey: ["org-invites", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const act = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: "cancel" | "resend" }) =>
      kind === "cancel" ? invitationsApi.cancel(id) : invitationsApi.resend(id),
    onSuccess: (_d, v) => {
      toast.success(v.kind === "cancel" ? t("org.invitations.cancelled") : t("org.invitations.resent"));
      qc.invalidateQueries({ queryKey: ["org-invites", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    toast.success(t("org.invitations.copied"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("org.invitations.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("org.invitations.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {canManage && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder={t("org.invitations.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
              <SelectTrigger className="sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORG_ROLES.filter((r) => r !== "owner").map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`roleLabels.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => invite.mutate()} disabled={!email.includes("@") || invite.isPending}>
              {invite.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {t("org.invitations.invite")}
            </Button>
          </div>
        )}

        {q.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !q.data?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("org.invitations.empty")}</p>
        ) : (
          <div className="space-y-2">
            {q.data.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm"
              >
                <span className="font-medium">{inv.email}</span>
                <Badge variant="secondary">{t(`roleLabels.${inv.role}`)}</Badge>
                <Badge variant={inv.status === "pending" ? "default" : "secondary"}>{inv.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  {t("org.invitations.expires")}: {new Date(inv.expiresAt).toLocaleDateString()}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => void copyLink(inv.token)}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> {t("org.invitations.copyLink")}
                  </Button>
                  {canManage && inv.status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => act.mutate({ id: inv.id, kind: "resend" })}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => act.mutate({ id: inv.id, kind: "cancel" })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RolesTab() {
  const { t } = useTranslation();
  const q = useQuery({
    queryKey: ["org-role-matrix"],
    queryFn: organizationsApi.rolePermissionMatrix,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("org.roles.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("org.roles.subtitle")}</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {q.isLoading || !q.data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-4 font-medium">{t("permissions.title")}</th>
                {ORG_ROLES.map((r) => (
                  <th key={r} className="px-2 py-2 text-center font-medium">
                    {t(`roleLabels.${r}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_ORG_PERMISSIONS.map((p) => (
                <tr key={p} className="border-b last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{t(`orgPermissionLabels.${p}`)}</td>
                  {ORG_ROLES.map((r) => (
                    <td key={r} className="px-2 py-2.5 text-center">
                      <Checkbox checked={q.data[r].includes(p)} disabled aria-label={`${r} ${p}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function LimitsTab({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const limitsQ = useQuery({
    queryKey: ["org-limits", organizationId],
    queryFn: () => limitsApi.get(organizationId),
  });
  const usageQ = useQuery({
    queryKey: ["org-usage", organizationId],
    queryFn: () => limitsApi.usage(organizationId),
  });

  if (limitsQ.isLoading || usageQ.isLoading || !limitsQ.data || !usageQ.data) {
    return <Skeleton className="h-64 w-full" />;
  }

  const rows: { key: string; used: number; max: number }[] = [
    { key: "users", used: usageQ.data.users, max: limitsQ.data.maxUsers },
    { key: "forms", used: usageQ.data.forms, max: limitsQ.data.maxForms },
    { key: "responses", used: usageQ.data.responses, max: limitsQ.data.maxResponses },
    { key: "webhooks", used: usageQ.data.webhooks, max: limitsQ.data.maxWebhooks },
    { key: "automations", used: usageQ.data.automations, max: limitsQ.data.maxAutomations },
    { key: "apiCalls", used: usageQ.data.apiCalls, max: limitsQ.data.maxApiCalls },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("org.limits.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("org.limits.subtitle")}</p>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        {rows.map((r) => (
          <div key={r.key} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium capitalize">{r.key}</span>
              <span className="text-muted-foreground">
                {r.used} {t("org.limits.of")} {r.max}
              </span>
            </div>
            <Progress value={r.max > 0 ? Math.min(100, (r.used / r.max) * 100) : 0} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
