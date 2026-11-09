import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveContainer, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_CONFIG = {
  succeeded: { label: "Sucesso", color: "hsl(var(--chart-2))" },
  failed: { label: "Falha", color: "hsl(var(--chart-1))" },
  running: { label: "Em execução", color: "hsl(var(--chart-3))" },
  pending: { label: "Pendente", color: "hsl(var(--chart-4))" },
  cancelled: { label: "Cancelada", color: "hsl(var(--chart-5))" },
} as const;

type DailyStat = { day: string; succeeded: number; failed: number };

export function StatsOverviewChart({ workspaceId }: { workspaceId?: string | undefined }) {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "chart", workspaceId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("executions")
        .select("created_at, status")
        .eq("workspace_id", workspaceId!)
        .gte("created_at", new Date(Date.now() - 14 * 86400_000).toISOString());
      if (error) throw error;

      const byDay = new Map<string, DailyStat>();
      for (const row of rows) {
        const day = new Date(row.created_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        const stat = byDay.get(day) ?? { day, succeeded: 0, failed: 0 };
        if (row.status === "succeeded") stat.succeeded += 1;
        if (row.status === "failed") stat.failed += 1;
        byDay.set(day, stat);
      }
      return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
    },
    enabled: !!workspaceId,
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Execuções · últimos 14 dias</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : data && data.length > 0 ? (
          <div className="h-72">
            <ChartContainer config={CHART_CONFIG} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickMargin={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="succeeded"
                    fill="var(--color-succeeded)"
                    radius={[4, 4, 0, 0]}
                    name="Sucesso"
                  />
                  <Bar
                    dataKey="failed"
                    fill="var(--color-failed)"
                    radius={[4, 4, 0, 0]}
                    name="Falha"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            Sem execuções nos últimos 14 dias
          </div>
        )}
      </CardContent>
    </Card>
  );
}
