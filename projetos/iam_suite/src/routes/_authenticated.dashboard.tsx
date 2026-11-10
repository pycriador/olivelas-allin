import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Layers, UserCheck, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [{ count: users }, { count: groups }, { count: active }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("groups").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return { users: users ?? 0, groups: groups ?? 0, active: active ?? 0 };
    },
  });

  const stats = [
    { label: t("dashboard.totalUsers"), value: data?.users, icon: Users, color: "from-primary to-primary/60" },
    { label: t("dashboard.totalGroups"), value: data?.groups, icon: Layers, color: "from-chart-2 to-chart-2/60" },
    { label: t("dashboard.activeUsers"), value: data?.active, icon: UserCheck, color: "from-success to-success/60" },
    { label: t("dashboard.yourRole"), value: isAdmin ? t("users.roleAdmin") : t("users.roleUser"), icon: Shield, color: "from-chart-5 to-chart-5/60" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="group relative overflow-hidden border-border/60 p-5 shadow-soft transition-all hover:shadow-elevated">
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-20" />
                  ) : (
                    <p className="mt-1 font-display text-3xl font-bold tracking-tight">{s.value}</p>
                  )}
                </div>
                <div className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br ${s.color} text-primary-foreground shadow-soft`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border/60 p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold">{t("dashboard.recent")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">—</p>
      </Card>
    </div>
  );
}
