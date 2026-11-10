import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/views")({
  head: () => ({
    meta: [
      { title: "Views — Visões catalogadas dos bancos" },
      {
        name: "description",
        content: "Todas as views e materialized views descobertas, com definição SQL completa.",
      },
      { property: "og:title", content: "Views — Visões catalogadas dos bancos" },
      { property: "og:description", content: "Inventário de views com DDL para consulta rápida." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["ds-views"],
    queryFn: async () =>
      (
        await supabase
          .from("ds_objects")
          .select(
            "id, name, object_type, definition, description, ds_schemas(name), data_sources(name)",
          )
          .in("object_type", ["view", "materialized_view"])
          .order("name")
      ).data ?? [],
  });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("ds.page.views.title")} subtitle={t("ds.page.views.subtitle")} />
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : data?.length ? (
        <Card>
          <CardContent className="p-2">
            <Accordion type="single" collapsible>
              {data.map((v) => (
                <AccordionItem key={v.id} value={v.id}>
                  <AccordionTrigger className="px-3">
                    <div className="flex flex-wrap items-center gap-2 text-left">
                      <Eye className="h-4 w-4" />
                      <span className="font-medium">
                        {v.ds_schemas?.name}.{v.name}
                      </span>
                      <Badge variant="secondary">{t(`ds.objectType.${v.object_type}`)}</Badge>
                      <span className="text-xs text-muted-foreground">{v.data_sources?.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3">
                    {v.description ? (
                      <p className="mb-2 text-sm text-muted-foreground">{v.description}</p>
                    ) : null}
                    <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                      {v.definition ?? t("ds.noDefinition")}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Eye}
          title={t("ds.catalogEmpty.title")}
          description={t("ds.catalogEmpty.description")}
        />
      )}
    </div>
  );
}
