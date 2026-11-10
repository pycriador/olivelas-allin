import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/reports")({ component: Page });

function Page() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () =>
      (await supabase.from("reports").select("*").order("updated_at", { ascending: false })).data ??
      [],
  });
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("pages.reports.title")} subtitle={t("pages.reports.subtitle")} />
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((r) => (
            <Card key={r.id} className="transition hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary">{r.category}</Badge>
                </div>
                <h3 className="font-semibold">{r.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
