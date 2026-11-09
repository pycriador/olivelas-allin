import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Stethoscope, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { demoEnvService } from "@/modules/demo-env/service";
import type { DiagnosisResult } from "@/modules/demo-env/types";

const statusBadge = (status: DiagnosisResult["status"]) => {
  const map: Record<string, "default" | "destructive" | "secondary"> = { healthy: "default", warning: "secondary", error: "destructive" };
  const icons: Record<string, React.ReactNode> = {
    healthy: <CheckCircle2 className="h-3 w-3" />,
    warning: <AlertTriangle className="h-3 w-3" />,
    error: <XCircle className="h-3 w-3" />,
  };
  const labels: Record<string, string> = { healthy: "Saudável", warning: "Atenção", error: "Erro" };
  return (
    <Badge variant={map[status] ?? "secondary"} className="gap-1">
      {icons[status]}
      {labels[status] ?? status}
    </Badge>
  );
};

export const Route = createFileRoute("/_app/admin/demo-env/diagnosis")({
  component: DemoEnvDiagnosisPage,
});

function DemoEnvDiagnosisPage() {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);

  const { data: results = [], refetch } = useQuery({
    queryKey: ["demo-env", "diagnosis"],
    queryFn: () => demoEnvService.runDiagnosis(),
    enabled: false,
  });

  const handleRun = async () => {
    setIsRunning(true);
    toast.loading("Executando diagnóstico...");
    try {
      await refetch();
      toast.success("Diagnóstico concluído");
    } catch {
      toast.error("Erro ao executar diagnóstico");
    } finally {
      setIsRunning(false);
    }
  };

  const counts = {
    healthy: results.filter((r) => r.status === "healthy").length,
    warning: results.filter((r) => r.status === "warning").length,
    error: results.filter((r) => r.status === "error").length,
  };

  const columns: Column<DiagnosisResult>[] = [
    { key: "category", header: "Categoria", sortable: true, sortFn: (a, b) => a.category.localeCompare(b.category), render: (r) => <span className="font-medium">{r.category}</span> },
    { key: "title", header: "Verificação", render: (r) => <span>{r.title}</span> },
    { key: "status", header: "Status", render: (r) => statusBadge(r.status) },
    { key: "description", header: "Descrição", render: (r) => <span className="text-sm text-muted-foreground">{r.description}</span> },
    { key: "affected", header: "Afetados", render: (r) => <span className="text-sm tabular-nums">{(r.affectedCount).toLocaleString("pt-BR")}</span> },
    { key: "details", header: "Detalhes", render: (r) => <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={r.details}>{r.details}</span> },
    { key: "timestamp", header: "Verificado Em", render: (r) => <span className="text-sm whitespace-nowrap">{new Date(r.timestamp).toLocaleString("pt-BR")}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Diagnóstico</h1>
            <DocButton module="demo-env" page="diagnosis" title="Diagnóstico" />
          </div>
          <p className="text-sm text-muted-foreground">Diagnóstico e verificação de consistência do ambiente de demonstração</p>
        </div>
        <Button onClick={handleRun} disabled={isRunning} size="lg">
          <Stethoscope className="mr-2 h-4 w-4" />{isRunning ? "Executando..." : "Executar Diagnóstico"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Saudáveis</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{counts.healthy}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Atenção</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{counts.warning}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Erros</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{counts.error}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        data={results}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchKeys={["category", "title", "description", "status"]}
        pageSize={15}
        searchPlaceholder="Pesquisar diagnósticos..."
        emptyMessage={results.length === 0 && !isRunning ? "Clique em \"Executar Diagnóstico\" para iniciar" : undefined}
      />
    </div>
  );
}
