import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, Users, Download, Upload, ThumbsUp, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/data-table";
import { analyticsService } from "@/modules/portal/service";
import type { PortalAnalytics } from "@/modules/portal/types";

export const Route = createFileRoute("/_app/portal/analytics")({
  head: () => ({ meta: [{ title: "Analytics do Portal — ServiceForge" }] }),
  component: PortalAnalyticsPage,
});

function PortalAnalyticsPage() {
  const { data: items = [] } = useQuery({
    queryKey: ["portal", "analytics", "list"],
    queryFn: () => analyticsService.list(),
  });

  const totalAcessos = items.reduce((s, a) => s + a.totalAccesses, 0);
  const visitantesUnicos = items.reduce((s, a) => s + a.uniqueVisitors, 0);
  const totalDownloads = items.reduce((s, a) => s + a.totalDownloads, 0);
  const totalUploads = items.reduce((s, a) => s + a.totalUploads, 0);
  const totalAprovacoes = items.reduce((s, a) => s + a.totalApprovals, 0);
  const totalQrCode = items.reduce((s, a) => s + a.qrCodeUsage, 0);

  const columns: Column<PortalAnalytics>[] = [
    {
      key: "period", header: "Período", sortable: true,
      sortFn: (a, b) => a.period.localeCompare(b.period),
      render: (a) => <span className="text-sm font-medium">{a.period}</span>,
    },
    {
      key: "totalAccesses", header: "Acessos", sortable: true,
      sortFn: (a, b) => a.totalAccesses - b.totalAccesses,
      render: (a) => <span className="text-sm">{a.totalAccesses}</span>,
    },
    {
      key: "uniqueVisitors", header: "Visitantes", sortable: true,
      sortFn: (a, b) => a.uniqueVisitors - b.uniqueVisitors,
      render: (a) => <span className="text-sm">{a.uniqueVisitors}</span>,
    },
    {
      key: "totalDownloads", header: "Downloads", sortable: true,
      sortFn: (a, b) => a.totalDownloads - b.totalDownloads,
      render: (a) => <span className="text-sm">{a.totalDownloads}</span>,
    },
    {
      key: "totalUploads", header: "Uploads", sortable: true,
      sortFn: (a, b) => a.totalUploads - b.totalUploads,
      render: (a) => <span className="text-sm">{a.totalUploads}</span>,
    },
    {
      key: "totalApprovals", header: "Aprovações", sortable: true,
      sortFn: (a, b) => a.totalApprovals - b.totalApprovals,
      render: (a) => <span className="text-sm">{a.totalApprovals}</span>,
    },
    {
      key: "totalRejections", header: "Rejeições", sortable: true,
      sortFn: (a, b) => a.totalRejections - b.totalRejections,
      render: (a) => <span className="text-sm">{a.totalRejections}</span>,
    },
    {
      key: "totalSignatures", header: "Assinaturas", sortable: true,
      sortFn: (a, b) => a.totalSignatures - b.totalSignatures,
      render: (a) => <span className="text-sm">{a.totalSignatures}</span>,
    },
    {
      key: "date", header: "Data", sortable: true,
      sortFn: (a, b) => a.date.localeCompare(b.date),
      render: (a) => <span className="text-sm whitespace-nowrap">{new Date(a.date).toLocaleDateString("pt-BR")}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics do Portal</h1>
        <p className="text-sm text-muted-foreground">Métricas e estatísticas de uso do portal</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Acessos</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAcessos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{visitantesUnicos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalDownloads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUploads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprovações</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAprovacoes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">QR Code Usage</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalQrCode}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={items}
        columns={columns}
        keyExtractor={(a) => a.id}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        searchPlaceholder="Pesquisar analytics..."
      />
    </div>
  );
}
