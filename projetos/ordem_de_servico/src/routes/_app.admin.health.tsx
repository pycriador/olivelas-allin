import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { healthService } from "@/modules/admin/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HeartPulse, Activity, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { DocButton } from "@/components/doc-button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/health")({
  head: () => ({ meta: [{ title: "Admin Central de Saúde — ServiceForge" }] }),
  component: AdminHealthPage,
});

function AdminHealthPage() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey: ["admin", "health", "list"], queryFn: () => healthService.list() });
  const { data: dash } = useQuery({ queryKey: ["admin", "health", "dash"], queryFn: () => healthService.getDashboard() });

  const runMutations = useMutation({
    mutationFn: () => healthService.runChecks(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "health"] }); toast.success("Verificações concluídas"); },
    onError: () => toast.error("Erro ao executar verificações"),
  });

  const healthy = items.filter(i => i.status === "healthy").length;
  const degraded = items.filter(i => i.status === "degraded").length;
  const unhealthy = items.filter(i => i.status === "unhealthy").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Central de Saúde</h1>
            <DocButton module="admin" page="health" title="Central de Saúde" />
          </div>
          <p className="text-sm text-muted-foreground">Monitoramento de todos os componentes do sistema</p>
        </div>
        <Button onClick={() => runMutations.mutate()} disabled={runMutations.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${runMutations.isPending ? "animate-spin" : ""}`} />
          Executar Verificações
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saudável</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{healthy}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Degradado</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600">{degraded}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Crítico</CardTitle>
            <HeartPulse className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{unhealthy}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Componentes do Sistema</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latência</TableHead>
                <TableHead>Última Verificação</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={item.status === "healthy" ? "default" : item.status === "degraded" ? "secondary" : "destructive"}>
                      {item.status === "healthy" ? "Saudável" : item.status === "degraded" ? "Degradado" : "Crítico"}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.latency}ms</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(item.lastCheck).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm">{item.details}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum componente encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
