import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Users, FileBarChart, LayoutDashboard, TrendingUp, Star, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

async function loadHome() {
  const [emp, rep, dash, act, rev] = await Promise.all([
    supabase.from("employees").select("id", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("id, name, category, updated_at")
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("dashboards")
      .select("id, name, description, color")
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("activities")
      .select("id, action, target, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("financial_transactions").select("amount, kind").eq("kind", "revenue"),
  ]);
  const revenue = (rev.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  return {
    employees: emp.count ?? 0,
    reports: rep.data ?? [],
    reportsCount: (rep.data ?? []).length,
    dashboards: dash.data ?? [],
    activities: act.data ?? [],
    revenue,
  };
}

function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["home"], queryFn: loadHome });
  const name =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0] ?? "";

  const kpis = [
    {
      label: t("home.kpis.employees"),
      value: data?.employees ?? 0,
      icon: Users,
      tone: "bg-primary/10 text-primary",
    },
    {
      label: t("home.kpis.reports"),
      value: data?.reportsCount ?? 0,
      icon: FileBarChart,
      tone: "bg-chart-2/10 text-chart-2",
    },
    {
      label: t("home.kpis.dashboards"),
      value: data?.dashboards.length ?? 0,
      icon: LayoutDashboard,
      tone: "bg-chart-3/10 text-chart-3",
    },
    {
      label: t("home.kpis.revenue"),
      value: formatCurrency(data?.revenue ?? 0),
      icon: TrendingUp,
      tone: "bg-chart-5/10 text-chart-5",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("home.greeting", { name })} subtitle={t("home.subtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${k.tone}`}>
                  <k.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-xl font-semibold">
                    {isLoading ? <Skeleton className="h-6 w-16" /> : k.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("home.sections.recentReports")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <ListSkeleton />
            ) : data?.reports.length ? (
              data.reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border p-3 transition hover:bg-accent/40"
                >
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">{r.category}</Badge>
                </div>
              ))
            ) : (
              <EmptyState message={t("home.empty")} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> {t("home.sections.activities")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <ListSkeleton />
            ) : data?.activities.length ? (
              data.activities.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-md p-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="flex-1">
                    <span className="font-medium">{a.action}</span>{" "}
                    <span className="text-muted-foreground">· {a.target}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState message={t("home.empty")} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4" /> {t("home.sections.dashboards")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data?.dashboards.map((d) => (
                  <div
                    key={d.id}
                    className="group cursor-pointer overflow-hidden rounded-lg border transition hover:shadow-md"
                  >
                    <div
                      className="h-16 w-full"
                      style={{
                        background: `linear-gradient(135deg, ${d.color ?? "#4F46E5"}, oklch(0.55 0.15 258))`,
                      }}
                    />
                    <div className="p-3">
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}
