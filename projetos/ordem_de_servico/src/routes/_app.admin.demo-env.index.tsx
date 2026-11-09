import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Users, UserCircle, Smartphone, Wrench,
  FileText, Replace, ShieldCheck, DollarSign, Layers,
  Zap, Workflow, ScrollText, Cable, BarChart3, LayoutDashboard,
  Clock, Trash2, RefreshCw, Download, Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { demoEnvService } from "@/modules/demo-env/service";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_app/admin/demo-env/")({
  component: DemoEnvDashboard,
});

function DemoEnvDashboard() {
  const { t } = useTranslation();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [cleanOpen, setCleanOpen] = useState(false);

  const { data: stats, refetch } = useQuery({
    queryKey: ["demo-env", "stats"],
    queryFn: () => demoEnvService.getStats(),
  });

  const handleRestore = async () => {
    setRestoreOpen(false);
    toast.loading("Restaurando ambiente demo...");
    await demoEnvService.restoreEnvironment();
    toast.success("Ambiente restaurado com sucesso!");
    refetch();
  };

  const handleClean = async () => {
    setCleanOpen(false);
    toast.loading("Limpando dados operacionais...");
    await demoEnvService.cleanOperationalData();
    toast.success("Dados limpos com sucesso!");
    refetch();
  };

  const items = stats ? [
    { icon: Building2, label: "Empresas", value: stats.companies, color: "text-blue-600" },
    { icon: Users, label: "Usuários", value: stats.users, color: "text-green-600" },
    { icon: UserCircle, label: "Clientes", value: stats.customers, color: "text-purple-600" },
    { icon: Smartphone, label: "Equipamentos", value: stats.devices, color: "text-orange-600" },
    { icon: Wrench, label: "Técnicos", value: stats.technicians, color: "text-cyan-600" },
    { icon: FileText, label: "Ordens de Serviço", value: stats.serviceOrders, color: "text-indigo-600" },
    { icon: Replace, label: "Retornos", value: stats.returns, color: "text-rose-600" },
    { icon: ShieldCheck, label: "Garantias", value: stats.warranties, color: "text-emerald-600" },
    { icon: DollarSign, label: "Pagamentos", value: stats.payments, color: "text-yellow-600" },
    { icon: Layers, label: "Documentos", value: stats.documents, color: "text-teal-600" },
    { icon: Zap, label: "Eventos", value: stats.events, color: "text-violet-600" },
    { icon: Workflow, label: "Workflows", value: stats.workflows, color: "text-sky-600" },
    { icon: ScrollText, label: "Auditorias", value: stats.audits, color: "text-pink-600" },
    { icon: Cable, label: "Integrações", value: stats.integrations, color: "text-lime-600" },
    { icon: BarChart3, label: "Relatórios", value: stats.reports, color: "text-amber-600" },
    { icon: LayoutDashboard, label: "Dashboards", value: stats.dashboards, color: "text-fuchsia-600" },
  ] : [];

  const infoItems = stats ? [
    { label: "Última Geração", value: stats.lastGeneration ? new Date(stats.lastGeneration).toLocaleString("pt-BR") : "Nunca" },
    { label: "Última Limpeza", value: stats.lastClean ? new Date(stats.lastClean).toLocaleString("pt-BR") : "Nunca" },
    { label: "Última Importação", value: stats.lastImport ? new Date(stats.lastImport).toLocaleString("pt-BR") : "Nunca" },
    { label: "Última Exportação", value: stats.lastExport ? new Date(stats.lastExport).toLocaleString("pt-BR") : "Nunca" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Demo Environment</h1>
            <DocButton module="demo-env" page="dashboard" title="Demo Environment" />
          </div>
          <p className="text-sm text-muted-foreground">Gerenciamento de ambientes de demonstração</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => setCleanOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />Limpar Dados
          </Button>
          <Button onClick={() => setRestoreOpen(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />Restaurar Ambiente Demo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.map((it) => (
          <Card key={it.label} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{it.label}</CardTitle>
              <it.icon className={`h-4 w-4 ${it.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">{it.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {infoItems.map((it) => (
          <Card key={it.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{it.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {it.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={cleanOpen}
        onOpenChange={setCleanOpen}
        title="Limpar Dados Operacionais"
        description="Todos os dados operacionais serão removidos. Estrutura da plataforma, metadados, templates e configurações serão preservados. Esta ação não pode ser desfeita."
        confirmLabel="Limpar"
        onConfirm={handleClean}
      />
      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restaurar Ambiente Demo"
        description="O ambiente será limpo e um novo cenário de demonstração será gerado automaticamente. Esta ação não pode ser desfeita."
        confirmLabel="Restaurar"
        onConfirm={handleRestore}
      />
    </div>
  );
}
