import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plug, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OrgGuard } from "@/components/org/org-guard";
import { INTEGRATION_CATALOG, integrationsApi } from "@/services/platform-extras-service";

export const Route = createFileRoute("/_app/integrations")({
  head: () => ({
    meta: [
      { title: "Integrações — IAM Pro Forms" },
      { name: "description", content: "Marketplace de integrações: Slack, Teams, Google Sheets, Drive, Zapier e Make." },
      { property: "og:title", content: "Integrações — IAM Pro Forms" },
      { property: "og:description", content: "Conecte o IAM Pro Forms às ferramentas da sua empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <OrgGuard>{(orgId) => <IntegrationsPage organizationId={orgId} />}</OrgGuard>
  ),
});

function IntegrationsPage({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["integrations", organizationId],
    queryFn: () => integrationsApi.list(organizationId),
  });

  const connect = useMutation({
    mutationFn: (providerId: string) => {
      const provider = INTEGRATION_CATALOG.find((p) => p.id === providerId)!;
      return integrationsApi.connect(organizationId, provider);
    },
    onSuccess: () => {
      toast.success(t("integrations.connectedToast"));
      qc.invalidateQueries({ queryKey: ["integrations", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnect = useMutation({
    mutationFn: (id: string) => integrationsApi.disconnect(id),
    onSuccess: () => {
      toast.success(t("integrations.disconnectedToast"));
      qc.invalidateQueries({ queryKey: ["integrations", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("integrations.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("integrations.subtitle")}</p>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {INTEGRATION_CATALOG.map((p) => {
            const installed = q.data?.find((i) => i.provider === p.id);
            const isConnected = installed?.status === "connected";
            return (
              <Card key={p.id}>
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <Plug className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {t(`integrations.categories.${p.category}`)}
                      </p>
                    </div>
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? t("integrations.connected") : t("integrations.disconnected")}
                    </Badge>
                  </div>
                  <p className="flex-1 text-sm text-muted-foreground">{p.description}</p>
                  {!p.available && (
                    <p className="text-[11px] text-muted-foreground">{t("integrations.simulation")}</p>
                  )}
                  <div>
                    {isConnected && installed ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnect.mutate(installed.id)}
                        disabled={disconnect.isPending}
                      >
                        {t("integrations.disconnect")}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => connect.mutate(p.id)} disabled={connect.isPending}>
                        {connect.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("integrations.connect")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
