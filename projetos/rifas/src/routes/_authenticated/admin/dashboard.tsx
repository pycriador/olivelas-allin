import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  LayoutDashboard,
  Megaphone,
  Pause,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserX,
  Users,
  Zap,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/status-states";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — RaffleHub" }],
  }),
  component: AdminDashboardPage,
});

interface AdminCounts {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  inactiveUsers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  finishedCampaigns: number;
  totalPlans: number;
  activePlans: number;
}

function useAdminMetrics() {
  return useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: async (): Promise<AdminCounts> => {
      const [activeRes, suspendedRes, pendingRes, inactiveRes, campaignsRes, plansRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("status", "ACTIVE")
            .is("deleted_at", null),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("status", "SUSPENDED")
            .is("deleted_at", null),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("status", "PENDING")
            .is("deleted_at", null),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("status", "INACTIVE")
            .is("deleted_at", null),
          supabase.from("campaigns").select("id, status").is("deleted_at", null).limit(10000),
          supabase.from("plans").select("id, active"),
        ]);

      const activeCampaigns = campaignsRes.data?.filter((c) => c.status === "ACTIVE").length ?? 0;
      const finishedCampaigns =
        campaignsRes.data?.filter((c) => c.status === "FINISHED").length ?? 0;
      const totalCampaigns = campaignsRes.data?.length ?? 0;

      return {
        totalUsers:
          (activeRes.count ?? 0) +
          (suspendedRes.count ?? 0) +
          (pendingRes.count ?? 0) +
          (inactiveRes.count ?? 0),
        activeUsers: activeRes.count ?? 0,
        suspendedUsers: suspendedRes.count ?? 0,
        pendingUsers: pendingRes.count ?? 0,
        inactiveUsers: inactiveRes.count ?? 0,
        totalCampaigns,
        activeCampaigns,
        finishedCampaigns,
        totalPlans: plansRes.data?.length ?? 0,
        activePlans: plansRes.data?.filter((p) => p.active).length ?? 0,
      };
    },
    staleTime: 30_000,
  });
}

function MetricCard({
  title,
  value,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "success" | "warning" | "destructive";
}) {
  const variantStyles = {
    default: "border-border bg-card",
    success: "border-emerald-500/30 bg-emerald-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    destructive: "border-destructive/30 bg-destructive/5",
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="flex items-center gap-4 p-4">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
            variant === "success"
              ? "bg-emerald-500/10 text-emerald-600"
              : variant === "warning"
                ? "bg-amber-500/10 text-amber-600"
                : variant === "destructive"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
          }`}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboardPage() {
  const { data: metrics, isLoading, isError, refetch } = useAdminMetrics();

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !metrics) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Administrativo</h1>
        <p className="text-sm text-muted-foreground">Visao geral da plataforma.</p>
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight uppercase text-muted-foreground">
          <Users className="size-4" />
          Usuarios
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total"
            value={String(metrics.totalUsers)}
            icon={Users}
            variant="default"
          />
          <MetricCard
            title="Ativos"
            value={String(metrics.activeUsers)}
            icon={UserCheck}
            variant="success"
          />
          <MetricCard
            title="Suspensos"
            value={String(metrics.suspendedUsers)}
            icon={UserX}
            variant="destructive"
          />
          <MetricCard
            title="Pendentes"
            value={String(metrics.pendingUsers)}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            title="Inativos"
            value={String(metrics.inactiveUsers)}
            icon={UserMinus}
            variant="default"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight uppercase text-muted-foreground">
          <Megaphone className="size-4" />
          Campanhas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Total"
            value={String(metrics.totalCampaigns)}
            icon={BarChart3}
            variant="default"
          />
          <MetricCard
            title="Ativas"
            value={String(metrics.activeCampaigns)}
            icon={CalendarCheck}
            variant="success"
          />
          <MetricCard
            title="Encerradas"
            value={String(metrics.finishedCampaigns)}
            icon={Pause}
            variant="warning"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight uppercase text-muted-foreground">
          <Zap className="size-4" />
          Infraestrutura IAM
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Planos cadastrados"
            value={String(metrics.totalPlans)}
            icon={LayoutDashboard}
            variant="default"
          />
          <MetricCard
            title="Planos ativos"
            value={String(metrics.activePlans)}
            icon={ShieldCheck}
            variant="success"
          />
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-72" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>

      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((card) => (
              <Skeleton key={card} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
