import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({ component: Page });

function Page() {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["analytics-tx"],
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_transactions")
        .select("amount, kind, occurred_at")
        .order("occurred_at");
      const byMonth: Record<string, { month: string; revenue: number; expense: number }> = {};
      (data ?? []).forEach((r) => {
        const m = new Date(r.occurred_at).toLocaleDateString("pt-BR", { month: "short" });
        byMonth[m] ||= { month: m, revenue: 0, expense: 0 };
        if (r.kind === "revenue") byMonth[m].revenue += Number(r.amount);
        else byMonth[m].expense += Number(r.amount);
      });
      return Object.values(byMonth);
    },
  });
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("pages.analytics.title")} subtitle={t("pages.analytics.subtitle")} />
      <Card>
        <CardHeader>
          <CardTitle>Receita vs Despesa</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" stroke="currentColor" fontSize={12} />
              <YAxis stroke="currentColor" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
