import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileJson, FileSpreadsheet, FileText, Loader2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/use-permissions";
import { downloadData, type DownloadFormat } from "@/lib/download";
import { type Permission } from "@/lib/permissions";
import { getReportDataAdminFn, type ReportId } from "@/lib/reports/admin.server";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatorios — Admin — RaffleHub" },
      { name: "description", content: "Exporte dados da plataforma em CSV, Excel ou JSON." },
    ],
  }),
  component: AdminRelatoriosPage,
});

const REPORT_META: Record<
  ReportId,
  { title: string; description: string; permission: Permission; icon: LucideIcon }
> = {
  customers: {
    title: "Clientes",
    description: "Todos os clientes cadastrados, com telefone, cidade, pedidos e total gasto.",
    permission: "reports.customer.view",
    icon: FileText,
  },
  payments: {
    title: "Pagamentos",
    description: "Todos os pagamentos (gateway e manuais), com status, valor e datas.",
    permission: "reports.payment.view",
    icon: FileText,
  },
  campaigns: {
    title: "Rifas",
    description: "Todas as campanhas/rifas, valores por numero, numeros e status.",
    permission: "reports.campaign.view",
    icon: FileText,
  },
  finance: {
    title: "Financeiro",
    description: "Resumo por rifa: pedidos, receita paga, reembolsado e liquido.",
    permission: "reports.finance.view",
    icon: FileText,
  },
  orders: {
    title: "Pedidos",
    description: "Todos os pedidos, com status, origem, metodo de pagamento e total.",
    permission: "reports.orders.view",
    icon: FileText,
  },
};

const EXPORT_FORMATS: Array<{ id: DownloadFormat; label: string; icon: LucideIcon }> = [
  { id: "csv", label: "CSV", icon: FileText },
  { id: "xlsx", label: "Excel", icon: FileSpreadsheet },
  { id: "json", label: "JSON", icon: FileJson },
];

function AdminRelatoriosPage() {
  const { can } = usePermissions();
  const [loading, setLoading] = useState<ReportId | null>(null);

  const allowedReports = (Object.keys(REPORT_META) as ReportId[]).filter((id) =>
    can(REPORT_META[id].permission),
  );

  const handleDownload = async (report: ReportId, format: DownloadFormat) => {
    setLoading(report);
    try {
      const data = await getReportDataAdminFn({ data: { report } });
      downloadData(
        data.headers,
        data.rows,
        format,
        `relatorio-${report}-${new Date().toISOString().slice(0, 10)}`,
      );
      toast.success(`${data.title} baixado em ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar relatorio");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relatorios</h1>
        <p className="text-sm text-muted-foreground">
          Exporte dados do sistema em CSV, Excel ou JSON.
        </p>
      </div>

      {allowedReports.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Voce nao tem permissao para acessar relatorios.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {allowedReports.map((id) => {
            const meta = REPORT_META[id];
            const isPending = loading === id;
            return (
              <Card key={id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <meta.icon className="size-4 text-muted-foreground" />
                    {meta.title}
                  </CardTitle>
                  <CardDescription>{meta.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {EXPORT_FORMATS.map((format) => (
                      <Button
                        key={format.id}
                        size="sm"
                        variant="outline"
                        disabled={loading !== null}
                        onClick={() => handleDownload(id, format.id)}
                      >
                        {isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <format.icon className="size-4" />
                        )}
                        {format.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
