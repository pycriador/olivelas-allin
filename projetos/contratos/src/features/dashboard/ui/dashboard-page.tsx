import { useQuery } from "@tanstack/react-query";
import { FolderKanban, PlaySquare, FileType, Users, Plug, ScrollText } from "lucide-react";
import { dashboardService } from "@/services/dashboard";
import { useWorkspaceStore } from "@/stores/workspace";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { StatCard, StatCardsGrid } from "@/components/shared/stat-card";
import { RecentExecutionsTable } from "@/features/dashboard/ui/recent-executions";
import { RecentActivityFeed } from "@/features/dashboard/ui/recent-activity";
import { StatsOverviewChart } from "@/features/dashboard/ui/stats-chart";

export function DashboardPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceId = workspace?.id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard", "stats", workspaceId],
    queryFn: () => dashboardService.getStats(workspaceId!),
    enabled: !!workspaceId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Visão geral${workspace ? ` · ${workspace.name}` : ""}`}
        description="Acompanhe projetos, execuções, documentos e atividades da sua operação."
      />

      <StatCardsGrid isLoading={isLoading}>
        <StatCard
          label="Projetos"
          value={stats?.projects ?? 0}
          icon={FolderKanban}
          hint="Projetos ativos"
        />
        <StatCard
          label="Execuções"
          value={stats?.executions ?? 0}
          icon={PlaySquare}
          hint={stats ? `${stats.alerts} com alerta` : "0 com alerta"}
          hintTone={stats && stats.alerts > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Documentos"
          value={stats?.documents ?? 0}
          icon={FileType}
          hint="Gerados pela plataforma"
        />
        <StatCard
          label="Usuários"
          value={stats?.users ?? 0}
          icon={Users}
          hint="Ativos no workspace"
        />
        <StatCard
          label="Conectores"
          value={stats?.connectors ?? 0}
          icon={Plug}
          hint="Fontes de dados"
        />
        <StatCard
          label="Registros de auditoria"
          value={stats?.auditLogs ?? 0}
          icon={ScrollText}
          hint="Ações registradas"
        />
      </StatCardsGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StatsOverviewChart workspaceId={workspaceId} />
        </div>
        <RecentActivityFeed workspaceId={workspaceId} />
      </div>

      <RecentExecutionsTable workspaceId={workspaceId} />
    </div>
  );
}
