import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Trash2, Play, FileDown, FileUp, Leaf, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { demoEnvService } from "@/modules/demo-env/service";
import type { DemoEnvHistory } from "@/modules/demo-env/types";

const actionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  restore: { icon: RefreshCw, label: "Restaurar", color: "text-blue-600" },
  clean: { icon: Trash2, label: "Limpeza", color: "text-rose-600" },
  generate: { icon: Play, label: "Gerar", color: "text-green-600" },
  scenario: { icon: Play, label: "Cenário", color: "text-purple-600" },
  seed: { icon: Leaf, label: "Seed", color: "text-amber-600" },
  import: { icon: FileUp, label: "Importar", color: "text-cyan-600" },
  export: { icon: FileDown, label: "Exportar", color: "text-indigo-600" },
};

const statusBadge = (status: string) => {
  const map: Record<string, "default" | "destructive" | "secondary"> = { completed: "default", failed: "destructive", running: "secondary" };
  return <Badge variant={map[status] ?? "secondary"}>{status === "completed" ? "Concluído" : status === "failed" ? "Falhou" : status === "running" ? "Executando" : status}</Badge>;
};

export const Route = createFileRoute("/_app/admin/demo-env/history")({
  component: DemoEnvHistoryPage,
});

function DemoEnvHistoryPage() {
  const { t } = useTranslation();

  const { data: history = [] } = useQuery({
    queryKey: ["demo-env", "history"],
    queryFn: () => demoEnvService.listHistory(),
  });

  const columns: Column<DemoEnvHistory>[] = [
    { key: "action", header: "Ação", sortable: true, sortFn: (a, b) => a.action.localeCompare(b.action), render: (h) => {
      const cfg = actionConfig[h.action] ?? { icon: RotateCcw, label: h.action, color: "text-muted-foreground" };
      const Icon = cfg.icon;
      return (
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${cfg.color}`} />
          <span className="font-medium">{cfg.label}</span>
        </div>
      );
    }},
    { key: "scenario", header: "Cenário", render: (h) => {
      const labels: Record<string, string> = { small: "Pequena", medium: "Média", large: "Grande", custom: "Personalizado" };
      return <span className="text-sm">{h.scenarioType ? labels[h.scenarioType] ?? h.scenarioType : "—"}</span>;
    }},
    { key: "status", header: "Status", render: (h) => statusBadge(h.status) },
    { key: "records", header: "Registros", sortable: true, sortFn: (a, b) => a.totalRecords - b.totalRecords, render: (h) => <span className="text-sm tabular-nums">{(h.totalRecords).toLocaleString("pt-BR")}</span> },
    { key: "duration", header: "Duração", render: (h) => <span className="text-sm tabular-nums">{(h.duration / 1000).toFixed(1)}s</span> },
    { key: "date", header: "Data", sortable: true, sortFn: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(), render: (h) => <span className="text-sm whitespace-nowrap">{new Date(h.timestamp).toLocaleString("pt-BR")}</span> },
    { key: "user", header: "Usuário", render: (h) => <span className="text-sm">{h.createdBy}</span> },
    { key: "details", header: "Detalhes", render: (h) => <span className="text-sm text-muted-foreground max-w-[250px] truncate block" title={h.details}>{h.details}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
            <DocButton module="demo-env" page="history" title="Histórico" />
          </div>
          <p className="text-sm text-muted-foreground">Histórico completo de ações do ambiente de demonstração</p>
        </div>
      </div>

      <DataTable
        data={history}
        columns={columns}
        keyExtractor={(h) => h.id}
        searchKeys={["action", "status", "createdBy", "details"]}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        initialSortColumn="date"
        initialSortDirection="desc"
        searchPlaceholder="Pesquisar no histórico..."
      />
    </div>
  );
}
