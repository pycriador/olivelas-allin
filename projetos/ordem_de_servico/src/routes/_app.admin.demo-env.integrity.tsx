import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { demoEnvService } from "@/modules/demo-env/service";
import type { IntegrityCheck } from "@/modules/demo-env/types";

const statusBadge = (status: IntegrityCheck["status"]) => {
  const map: Record<string, "default" | "destructive" | "secondary"> = { passed: "default", failed: "destructive", warning: "secondary" };
  const icons: Record<string, React.ReactNode> = {
    passed: <CheckCircle2 className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    warning: <AlertTriangle className="h-3 w-3" />,
  };
  const labels: Record<string, string> = { passed: "Integridade OK", failed: "Falha", warning: "Atenção" };
  return (
    <Badge variant={map[status] ?? "secondary"} className="gap-1">
      {icons[status]}
      {labels[status] ?? status}
    </Badge>
  );
};

export const Route = createFileRoute("/_app/admin/demo-env/integrity")({
  component: DemoEnvIntegrityPage,
});

function DemoEnvIntegrityPage() {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);

  const { data: checks = [], refetch } = useQuery({
    queryKey: ["demo-env", "integrity"],
    queryFn: () => demoEnvService.checkIntegrity(),
    enabled: false,
  });

  const handleVerify = async () => {
    setIsRunning(true);
    toast.loading("Verificando integridade...");
    try {
      await refetch();
      toast.success("Verificação de integridade concluída");
    } catch {
      toast.error("Erro ao verificar integridade");
    } finally {
      setIsRunning(false);
    }
  };

  const counts = {
    passed: checks.filter((c) => c.status === "passed").length,
    warning: checks.filter((c) => c.status === "warning").length,
    failed: checks.filter((c) => c.status === "failed").length,
  };

  const columns: Column<IntegrityCheck>[] = [
    { key: "check", header: "Verificação", sortable: true, sortFn: (a, b) => a.check.localeCompare(b.check), render: (c) => <span className="font-medium">{c.check}</span> },
    { key: "description", header: "Descrição", render: (c) => <span>{c.description}</span> },
    { key: "status", header: "Status", render: (c) => statusBadge(c.status) },
    { key: "details", header: "Detalhes", render: (c) => <span className="text-sm text-muted-foreground max-w-[250px] truncate block" title={c.details}>{c.details}</span> },
    { key: "affected", header: "Entidades Afetadas", render: (c) => {
      if (c.affectedEntities.length === 0) return <span className="text-sm text-muted-foreground">Nenhuma</span>;
      return (
        <div className="flex gap-1 flex-wrap">
          {c.affectedEntities.map((e) => (
            <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
          ))}
        </div>
      );
    }},
    { key: "timestamp", header: "Verificado Em", render: (c) => <span className="text-sm whitespace-nowrap">{new Date(c.timestamp).toLocaleString("pt-BR")}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Integridade</h1>
            <DocButton module="demo-env" page="integrity" title="Integridade" />
          </div>
          <p className="text-sm text-muted-foreground">Verificação de integridade referencial do ambiente de demonstração</p>
        </div>
        <Button onClick={handleVerify} disabled={isRunning} size="lg">
          <ShieldCheck className="mr-2 h-4 w-4" />{isRunning ? "Verificando..." : "Verificar Integridade"}
        </Button>
      </div>

      {checks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Integridade OK</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{counts.passed}</div>
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
              <CardTitle className="text-xs font-medium text-muted-foreground">Falhas</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{counts.failed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        data={checks}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchKeys={["check", "description", "details", "status"]}
        pageSize={15}
        searchPlaceholder="Pesquisar verificações..."
        emptyMessage={checks.length === 0 && !isRunning ? "Clique em \"Verificar Integridade\" para iniciar" : undefined}
      />
    </div>
  );
}
