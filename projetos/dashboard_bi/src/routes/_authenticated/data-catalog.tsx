import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BookOpen, Search } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/data-catalog")({
  head: () => ({
    meta: [
      { title: "Data Catalog — Catálogo corporativo de dados" },
      {
        name: "description",
        content:
          "Pesquise tabelas, views e colunas do catálogo corporativo, com nomes amigáveis, descrições e tags de governança.",
      },
      { property: "og:title", content: "Data Catalog — Catálogo corporativo de dados" },
      {
        property: "og:description",
        content: "Busca global de metadados com curadoria de nomes amigáveis e tags.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [term, setTerm] = useState("");

  const objects = useQuery({
    queryKey: ["ds-catalog", "objects", term],
    queryFn: async () => {
      let q = supabase
        .from("ds_objects")
        .select(
          "id, name, object_type, friendly_name, description, tags, estimated_rows, ds_schemas(name), data_sources(name)",
        )
        .order("name")
        .limit(100);
      if (term) q = q.or(`name.ilike.%${term}%,friendly_name.ilike.%${term}%`);
      return (await q).data ?? [];
    },
  });

  const columns = useQuery({
    queryKey: ["ds-catalog", "columns", term],
    enabled: term.length > 1,
    queryFn: async () =>
      (
        await supabase
          .from("ds_columns")
          .select("id, name, data_type, friendly_name, description, ds_objects(name)")
          .ilike("name", `%${term}%`)
          .order("name")
          .limit(100)
      ).data ?? [],
  });

  const saveObject = async (
    id: string,
    patch: { friendly_name?: string | null; description?: string | null },
  ) => {
    const { error } = await supabase.from("ds_objects").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(t("ds.toast.saved"));
      void qc.invalidateQueries({ queryKey: ["ds-catalog"] });
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("ds.page.catalog.title")} subtitle={t("ds.page.catalog.subtitle")} />

      <div className="mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          className="max-w-md"
          placeholder={t("ds.searchCatalog")}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="objects">
        <TabsList>
          <TabsTrigger value="objects">{t("ds.tab.objects")}</TabsTrigger>
          <TabsTrigger value="columns">{t("ds.tab.columns")}</TabsTrigger>
        </TabsList>

        <TabsContent value="objects" className="mt-4 space-y-3">
          {objects.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : objects.data?.length ? (
            objects.data.map((o) => (
              <Card key={o.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{t(`ds.objectType.${o.object_type}`)}</Badge>
                    <span className="font-medium">
                      {o.ds_schemas?.name}.{o.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{o.data_sources?.name}</span>
                    {(o.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Input
                      defaultValue={o.friendly_name ?? ""}
                      placeholder={t("ds.field.friendlyName")}
                      onBlur={(e) =>
                        e.target.value !== (o.friendly_name ?? "") &&
                        void saveObject(o.id, { friendly_name: e.target.value || null })
                      }
                    />
                    <Input
                      defaultValue={o.description ?? ""}
                      placeholder={t("ds.field.description")}
                      onBlur={(e) =>
                        e.target.value !== (o.description ?? "") &&
                        void saveObject(o.id, { description: e.target.value || null })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={BookOpen}
              title={t("ds.catalogEmpty.title")}
              description={t("ds.catalogEmpty.description")}
            />
          )}
        </TabsContent>

        <TabsContent value="columns" className="mt-4 space-y-2">
          {term.length < 2 ? (
            <EmptyState icon={Search} title={t("ds.typeToSearch")} />
          ) : columns.data?.length ? (
            columns.data.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="outline">{c.data_type}</Badge>
                  <span className="text-muted-foreground">{c.ds_objects?.name}</span>
                  {c.description ? (
                    <span className="text-muted-foreground">· {c.description}</span>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState icon={Search} title={t("ds.noResults")} />
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Button variant="outline" onClick={() => setTerm("")}>
          {t("ds.action.clearSearch")}
        </Button>
      </div>
    </div>
  );
}
