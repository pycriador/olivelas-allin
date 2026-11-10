import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Columns3 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/schemas")({
  head: () => ({
    meta: [
      { title: "Schemas — Estrutura dos bancos conectados" },
      {
        name: "description",
        content:
          "Todos os schemas descobertos nas conexões da organização, com contagem de tabelas e views.",
      },
      { property: "og:title", content: "Schemas — Estrutura dos bancos conectados" },
      { property: "og:description", content: "Inventário de schemas por fonte de dados." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["ds-schemas-all"],
    queryFn: async () => {
      const [schemasRes, objectsRes] = await Promise.all([
        supabase
          .from("ds_schemas")
          .select("id, name, comment, data_sources(name, type)")
          .order("name"),
        supabase.from("ds_objects").select("schema_id, object_type"),
      ]);
      const counts = new Map<string, { tables: number; views: number }>();
      for (const o of objectsRes.data ?? []) {
        const c = counts.get(o.schema_id) ?? { tables: 0, views: 0 };
        if (o.object_type === "table") c.tables += 1;
        else c.views += 1;
        counts.set(o.schema_id, c);
      }
      return (schemasRes.data ?? []).map((s) => ({
        ...s,
        counts: counts.get(s.id) ?? { tables: 0, views: 0 },
      }));
    },
  });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("ds.page.schemas.title")} subtitle={t("ds.page.schemas.subtitle")} />
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Columns3 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{s.name}</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.data_sources?.name}</p>
                <div className="mt-3 flex gap-2">
                  <Badge variant="secondary">
                    {s.counts.tables} {t("ds.stat.tables")}
                  </Badge>
                  <Badge variant="outline">
                    {s.counts.views} {t("ds.stat.views")}
                  </Badge>
                </div>
                {s.comment ? (
                  <p className="mt-2 text-sm text-muted-foreground">{s.comment}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Columns3}
          title={t("ds.catalogEmpty.title")}
          description={t("ds.catalogEmpty.description")}
        />
      )}
    </div>
  );
}
