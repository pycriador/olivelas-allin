import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, History, Package, FileJson } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { demoEnvService } from "@/modules/demo-env/service";
import type { DemoEnvHistory } from "@/modules/demo-env/types";

export const Route = createFileRoute("/_app/admin/demo-env/export")({
  component: DemoEnvExportPage,
});

function DemoEnvExportPage() {
  const { t } = useTranslation();

  const { data: stats } = useQuery({
    queryKey: ["demo-env", "stats"],
    queryFn: () => demoEnvService.getStats(),
  });

  const { data: history = [] } = useQuery({
    queryKey: ["demo-env", "history", "export"],
    queryFn: () => demoEnvService.listHistory(),
  });

  const exportHistory = history.filter((h) => h.action === "export");

  const handleExport = async () => {
    toast.loading("Exportando ambiente...");
    try {
      const payload = await demoEnvService.exportEnvironment("admin");
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `demo-env-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Ambiente exportado: ${payload.metadata.totalRecords} registros`);
    } catch {
      toast.error("Erro ao exportar ambiente");
    }
  };

  const columns: Column<DemoEnvHistory>[] = [
    { key: "action", header: "Ação", render: () => <Badge variant="secondary">Exportação</Badge> },
    { key: "status", header: "Status", render: (h) => (
      <Badge variant={h.status === "completed" ? "default" : "destructive"}>{h.status === "completed" ? "Concluído" : "Falhou"}</Badge>
    )},
    { key: "records", header: "Registros", render: (h) => <span className="text-sm">{(h.totalRecords).toLocaleString("pt-BR")}</span> },
    { key: "duration", header: "Duração", render: (h) => <span className="text-sm">{(h.duration / 1000).toFixed(1)}s</span> },
    { key: "date", header: "Data", sortable: true, sortFn: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(), render: (h) => <span className="text-sm whitespace-nowrap">{new Date(h.timestamp).toLocaleString("pt-BR")}</span> },
    { key: "user", header: "Usuário", render: (h) => <span className="text-sm">{h.createdBy}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Exportar Ambiente</h1>
            <DocButton module="demo-env" page="export" title="Exportar Ambiente" />
          </div>
          <p className="text-sm text-muted-foreground">Exporte todo o ambiente de demonstração como arquivo JSON</p>
        </div>
        <Button onClick={handleExport} size="lg">
          <Download className="mr-2 h-4 w-4" />Exportar Ambiente
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total de Entidades</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Registros no Ambiente</CardTitle>
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats ? Object.entries(stats).reduce((a, [, v]) => a + (typeof v === "number" ? v : 0), 0) : 0).toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Última Exportação</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium truncate">{stats?.lastExport ? new Date(stats.lastExport).toLocaleString("pt-BR") : "Nunca"}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Histórico de Exportações</h2>
        <DataTable
          data={exportHistory}
          columns={columns}
          keyExtractor={(h) => h.id}
          initialSortColumn="date"
          initialSortDirection="desc"
          searchPlaceholder="Pesquisar exportações..."
        />
      </div>
    </div>
  );
}
