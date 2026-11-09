import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, PlayCircle, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { demoEnvService } from "@/modules/demo-env/service";
import type { DemoSeedEntry } from "@/modules/demo-env/types";

const statusBadge = (status: DemoSeedEntry["status"]) => {
  const map: Record<string, "default" | "destructive" | "secondary" | "outline"> = { completed: "default", failed: "destructive", running: "secondary", pending: "outline" };
  const icons: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="h-3 w-3" />,
    failed: <XCircle className="h-3 w-3" />,
    running: <Clock className="h-3 w-3 animate-spin" />,
    pending: <Clock className="h-3 w-3" />,
  };
  return (
    <Badge variant={map[status] ?? "outline"} className="gap-1">
      {icons[status]}
      {status === "completed" ? "Concluído" : status === "failed" ? "Falhou" : status === "running" ? "Executando" : "Pendente"}
    </Badge>
  );
};

export const Route = createFileRoute("/_app/admin/demo-env/seeds")({
  component: DemoEnvSeedsPage,
});

function DemoEnvSeedsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: seeds = [] } = useQuery({
    queryKey: ["demo-env", "seeds"],
    queryFn: () => demoEnvService.listSeeds(),
  });

  const runMut = useMutation({
    mutationFn: (name: string) => demoEnvService.runSeed(name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["demo-env", "seeds"] }); toast.success("Seed executada com sucesso"); },
    onError: () => toast.error("Erro ao executar seed"),
  });

  const runAllMut = useMutation({
    mutationFn: () => demoEnvService.runAllSeeds(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["demo-env", "seeds"] }); toast.success("Todas as seeds concluídas"); },
    onError: () => toast.error("Erro ao executar seeds"),
  });

  const columns: Column<DemoSeedEntry>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "collection", header: "Coleção", render: (s) => <span className="text-sm text-muted-foreground">{s.collection}</span> },
    { key: "status", header: "Status", render: (s) => statusBadge(s.status) },
    { key: "records", header: "Registros", render: (s) => <span className="text-sm">{(s.recordsCount).toLocaleString("pt-BR")}</span> },
    { key: "duration", header: "Duração", render: (s) => <span className="text-sm">{(s.duration / 1000).toFixed(1)}s</span> },
    { key: "lastRun", header: "Última Execução", render: (s) => <span className="text-sm">{s.lastRun ? new Date(s.lastRun).toLocaleString("pt-BR") : "—"}</span> },
    { key: "lastRunBy", header: "Executado Por", render: (s) => <span className="text-sm">{s.lastRunBy ?? "—"}</span> },
    { key: "error", header: "Erro", render: (s) => s.error ? <span className="text-sm text-destructive max-w-[200px] truncate block" title={s.error}>{s.error}</span> : <span className="text-sm text-muted-foreground">—</span> },
    { key: "actions", header: "Ações", render: (s) => (
      <Button size="sm" variant="ghost" onClick={() => runMut.mutate(s.name)} disabled={runMut.isPending}>
        <Play className="h-4 w-4" />
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Seeds</h1>
            <DocButton module="demo-env" page="seeds" title="Seeds" />
          </div>
          <p className="text-sm text-muted-foreground">Gerenciamento de seeds do ambiente de demonstração</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => runMut.mutate("validate")} disabled={runMut.isPending}>
            <AlertTriangle className="mr-2 h-4 w-4" />Validar
          </Button>
          <Button variant="secondary" onClick={() => runAllMut.mutate()} disabled={runAllMut.isPending}>
            <PlayCircle className="mr-2 h-4 w-4" />Executar Todos
          </Button>
          <Button onClick={() => runMut.mutate("all")} disabled={runMut.isPending}>
            <Play className="mr-2 h-4 w-4" />Executar Seeds
          </Button>
        </div>
      </div>

      <DataTable
        data={seeds}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchKeys={["name", "collection", "status"]}
        pageSize={15}
        pageSizeOptions={[10, 15, 25, 50]}
        searchPlaceholder="Pesquisar seeds..."
      />
    </div>
  );
}
