import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { demoEnvService } from "@/modules/demo-env/service";
import type { DemoEnvLog } from "@/modules/demo-env/types";

const actionLabels: Record<string, string> = {
  restore: "Restaurar", clean: "Limpeza", generate: "Gerar",
  scenario: "Cenário", seed: "Seed", import: "Importar", export: "Exportar",
};

const statusBadge = (status: string) => {
  const map: Record<string, "default" | "destructive" | "secondary" | "outline"> = { completed: "default", failed: "destructive", running: "secondary", pending: "outline" };
  const labels: Record<string, string> = { completed: "Concluído", failed: "Falhou", running: "Executando", pending: "Pendente" };
  return <Badge variant={map[status] ?? "outline"}>{labels[status] ?? status}</Badge>;
};

export const Route = createFileRoute("/_app/admin/demo-env/logs")({
  component: DemoEnvLogsPage,
});

function DemoEnvLogsPage() {
  const { t } = useTranslation();

  const { data: logs = [] } = useQuery({
    queryKey: ["demo-env", "logs"],
    queryFn: () => demoEnvService.listLogs(),
  });

  const columns: Column<DemoEnvLog>[] = [
    { key: "action", header: "Ação", sortable: true, sortFn: (a, b) => a.action.localeCompare(b.action), render: (l) => (
      <span className="font-medium">{actionLabels[l.action] ?? l.action}</span>
    )},
    { key: "status", header: "Status", render: (l) => statusBadge(l.status) },
    { key: "message", header: "Mensagem", sortable: true, sortFn: (a, b) => a.message.localeCompare(b.message), render: (l) => <span>{l.message}</span> },
    { key: "duration", header: "Duração", render: (l) => <span className="text-sm tabular-names">{(l.duration / 1000).toFixed(1)}s</span> },
    { key: "timestamp", header: "Timestamp", sortable: true, sortFn: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(), render: (l) => <span className="text-sm whitespace-nowrap">{new Date(l.timestamp).toLocaleString("pt-BR")}</span> },
    { key: "createdBy", header: "Usuário", render: (l) => <span className="text-sm">{l.createdBy}</span> },
    { key: "companyId", header: "Empresa", render: (l) => <span className="text-sm text-muted-foreground">{l.companyId ?? "—"}</span> },
    { key: "details", header: "Detalhes", render: (l) => <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={l.details}>{l.details}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
            <DocButton module="demo-env" page="logs" title="Logs" />
          </div>
          <p className="text-sm text-muted-foreground">Logs detalhados do ambiente de demonstração</p>
        </div>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        keyExtractor={(l) => l.id}
        searchKeys={["action", "message", "details", "createdBy", "status"]}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        initialSortColumn="timestamp"
        initialSortDirection="desc"
        searchPlaceholder="Pesquisar logs..."
      />
    </div>
  );
}
