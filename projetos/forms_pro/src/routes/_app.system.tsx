import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OrgGuard } from "@/components/org/org-guard";
import { flagsApi, systemApi } from "@/services/platform-extras-service";

export const Route = createFileRoute("/_app/system")({
  head: () => ({
    meta: [
      { title: "Sistema — IAM Pro Forms" },
      { name: "description", content: "Feature flags por organização e eventos operacionais da plataforma." },
      { property: "og:title", content: "Sistema — IAM Pro Forms" },
      { property: "og:description", content: "Governança: flags, severidade e eventos do sistema." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <OrgGuard>{(orgId) => <SystemPage organizationId={orgId} />}</OrgGuard>,
});

const SEVERITY_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  info: "secondary",
  success: "default",
  warning: "secondary",
  error: "destructive",
};

function SystemPage({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const flagsQ = useQuery({
    queryKey: ["feature-flags", organizationId],
    queryFn: () => flagsApi.list(organizationId),
  });
  const eventsQ = useQuery({
    queryKey: ["system-events", organizationId],
    queryFn: () => systemApi.events(organizationId),
  });

  const toggle = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      flagsApi.setOverride(key, organizationId, enabled),
    onSuccess: () => {
      toast.success(t("system.flags.updated"));
      qc.invalidateQueries({ queryKey: ["feature-flags", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const keys = Array.from(new Set((flagsQ.data ?? []).map((f) => f.key)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("system.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("system.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("system.flags.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("system.flags.subtitle")}</p>
        </CardHeader>
        <CardContent>
          {flagsQ.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !keys.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("system.flags.empty")}</p>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => {
                const flags = flagsQ.data ?? [];
                const enabled = flagsApi.resolve(flags, key, organizationId);
                const scoped = flags.some((f) => f.key === key && f.organizationId === organizationId);
                const description =
                  flags.find((f) => f.key === key && f.description)?.description ?? "";
                return (
                  <div key={key} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{key}</p>
                      <p className="truncate text-xs text-muted-foreground">{description}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {scoped ? t("system.flags.override") : t("system.flags.global")}
                    </Badge>
                    <Switch
                      checked={enabled}
                      disabled={toggle.isPending}
                      onCheckedChange={(v) => toggle.mutate({ key, enabled: v })}
                      aria-label={key}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("system.events.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsQ.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !eventsQ.data?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("system.events.empty")}</p>
          ) : (
            <div className="space-y-2">
              {eventsQ.data.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
                  <Badge variant={SEVERITY_VARIANT[e.severity] ?? "secondary"}>{e.severity}</Badge>
                  <span className="text-xs text-muted-foreground">{e.source}</span>
                  <span className="min-w-0 flex-1 truncate">{e.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
