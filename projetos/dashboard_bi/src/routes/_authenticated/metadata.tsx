import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/metadata")({
  head: () => ({
    meta: [
      { title: "Metadata — Cobertura de documentação do catálogo" },
      {
        name: "description",
        content:
          "Acompanhe quanto do catálogo corporativo já possui nomes amigáveis, descrições e tags de governança.",
      },
      { property: "og:title", content: "Metadata — Cobertura de documentação do catálogo" },
      {
        property: "og:description",
        content: "Indicadores de governança e curadoria de metadados.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["ds-metadata"],
    queryFn: async () => {
      const [objectsRes, columnsRes, runsRes] = await Promise.all([
        supabase
          .from("ds_objects")
          .select("id, name, friendly_name, description, tags, object_type, ds_schemas(name)"),
        supabase.from("ds_columns").select("id, description"),
        supabase
          .from("ds_sync_runs")
          .select("id, status, started_at, duration_ms, data_sources(name)")
          .order("started_at", { ascending: false })
          .limit(10),
      ]);
      const objects = objectsRes.data ?? [];
      const columns = columnsRes.data ?? [];
      return {
        objects,
        totalObjects: objects.length,
        described: objects.filter((o) => o.description).length,
        named: objects.filter((o) => o.friendly_name).length,
        tagged: objects.filter((o) => (o.tags ?? []).length > 0).length,
        totalColumns: columns.length,
        describedColumns: columns.filter((c) => c.description).length,
        runs: runsRes.data ?? [],
      };
    },
  });

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("ds.page.metadata.title")} subtitle={t("ds.page.metadata.subtitle")} />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : !data?.totalObjects ? (
        <EmptyState
          icon={FileText}
          title={t("ds.catalogEmpty.title")}
          description={t("ds.catalogEmpty.description")}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["ds.meta.named", data.named, data.totalObjects],
              ["ds.meta.described", data.described, data.totalObjects],
              ["ds.meta.tagged", data.tagged, data.totalObjects],
              ["ds.meta.columnsDescribed", data.describedColumns, data.totalColumns],
            ].map(([key, a, b]) => (
              <Card key={String(key)}>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{t(String(key))}</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {pct(Number(a), Number(b))}
                    <span className="text-sm font-normal text-muted-foreground">%</span>
                  </p>
                  <Progress className="mt-3" value={pct(Number(a), Number(b))} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {Number(a)} / {Number(b)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="mb-3 mt-8 text-lg font-semibold">{t("ds.meta.undocumented")}</h2>
          <Card>
            <CardContent className="divide-y p-0">
              {data.objects
                .filter((o) => !o.description || !o.friendly_name)
                .slice(0, 25)
                .map((o) => (
                  <div key={o.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                    <span className="font-medium">
                      {o.ds_schemas?.name}.{o.name}
                    </span>
                    <Badge variant="secondary">{t(`ds.objectType.${o.object_type}`)}</Badge>
                    {!o.friendly_name ? (
                      <Badge variant="outline">{t("ds.meta.missingName")}</Badge>
                    ) : null}
                    {!o.description ? (
                      <Badge variant="outline">{t("ds.meta.missingDescription")}</Badge>
                    ) : null}
                  </div>
                ))}
            </CardContent>
          </Card>

          <h2 className="mb-3 mt-8 text-lg font-semibold">{t("ds.meta.recentSyncs")}</h2>
          <Card>
            <CardContent className="divide-y p-0">
              {data.runs.length ? (
                data.runs.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                    <Badge variant={r.status === "success" ? "secondary" : "outline"}>
                      {t(`ds.syncStatus.${r.status}`)}
                    </Badge>
                    <span className="font-medium">{r.data_sources?.name}</span>
                    <span className="text-muted-foreground">
                      {new Date(r.started_at).toLocaleString()}
                    </span>
                    {r.duration_ms ? (
                      <span className="text-muted-foreground">· {r.duration_ms}ms</span>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="p-3 text-sm text-muted-foreground">{t("ds.none")}</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
