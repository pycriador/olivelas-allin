import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutDashboard, FileText, Table2, Database, Download, Activity, TrendingUp, Palette, Clock } from "lucide-react";
import { dashboardService, reportService, widgetService, templateService, datasetService, kpiService, exportService, executionService } from "@/modules/reporting/service";

export const Route = createFileRoute("/_app/reporting/dashboard")({
  head: () => ({ meta: [{ title: "Reporting Dashboard — ServiceForge" }] }),
  component: ReportingDashboardPage,
});

function ReportingDashboardPage() {
  const { data: dashboards = [] } = useQuery({ queryKey: ["rpt", "dashboards", "list"], queryFn: () => dashboardService.list() });
  const { data: reports = [] } = useQuery({ queryKey: ["rpt", "reports", "list"], queryFn: () => reportService.list() });
  const { data: widgets = [] } = useQuery({ queryKey: ["rpt", "widgets", "list"], queryFn: () => widgetService.list() });
  const { data: templates = [] } = useQuery({ queryKey: ["rpt", "templates", "list"], queryFn: () => templateService.list() });
  const { data: datasets = [] } = useQuery({ queryKey: ["rpt", "datasets", "list"], queryFn: () => datasetService.list() });
  const { data: kpis = [] } = useQuery({ queryKey: ["rpt", "kpis", "list"], queryFn: () => kpiService.list() });
  const { data: exports } = useQuery({ queryKey: ["rpt", "exports", "list"], queryFn: () => exportService.list() });
  const { data: executions = [] } = useQuery({ queryKey: ["rpt", "executions", "list"], queryFn: () => executionService.list() });

  const cards = [
    { icon: LayoutDashboard, label: "Dashboards", value: dashboards.length, color: "text-blue-600" },
    { icon: FileText, label: "Relatórios", value: reports.length, color: "text-green-600" },
    { icon: Table2, label: "Widgets", value: widgets.length, color: "text-purple-600" },
    { icon: Database, label: "Datasets", value: datasets.length, color: "text-orange-600" },
    { icon: TrendingUp, label: "KPIs", value: kpis.length, color: "text-rose-600" },
    { icon: Palette, label: "Templates", value: templates.length, color: "text-indigo-600" },
    { icon: Download, label: "Exportações", value: exports?.length ?? 0, color: "text-cyan-600" },
    { icon: Activity, label: "Execuções", value: executions.length, color: "text-teal-600" },
  ];

  const recentLogs = [...executions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reporting & BI</h1>
        <p className="text-sm text-muted-foreground">Plataforma de Business Intelligence e Relatórios</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Execuções Recentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell><Badge variant="outline">{log.type}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                  <TableCell className="text-sm">{log.referenceName}</TableCell>
                  <TableCell className="text-sm">{log.duration}ms</TableCell>
                  <TableCell><Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status === "success" ? "Sucesso" : "Erro"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))}
              {recentLogs.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma execução encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
