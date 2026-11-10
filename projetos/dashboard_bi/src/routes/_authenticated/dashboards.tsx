import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboards")({ component: Page });

function Page() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboards"],
    queryFn: async () =>
      (await supabase.from("dashboards").select("*").order("updated_at", { ascending: false }))
        .data ?? [],
  });
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("pages.dashboards.title")} subtitle={t("pages.dashboards.subtitle")} />
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((d) => (
            <Card key={d.id} className="overflow-hidden transition hover:shadow-md">
              <div
                className="h-24"
                style={{
                  background: `linear-gradient(135deg, ${d.color ?? "#4F46E5"}, oklch(0.55 0.15 258))`,
                }}
              />
              <CardContent className="p-5">
                <h3 className="font-semibold">{d.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
