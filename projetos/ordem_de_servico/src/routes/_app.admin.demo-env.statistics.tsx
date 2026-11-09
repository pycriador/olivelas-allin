import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, UserCircle, Smartphone, Wrench, FileText, Replace, ShieldCheck, DollarSign, Layers, Zap, Workflow, ScrollText, BarChart3, LayoutDashboard, Cable, Clock, Activity, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { demoEnvService } from "@/modules/demo-env/service";

const statCards = [
  { key: "companies", icon: Building2, label: "Empresas", color: "text-blue-600" },
  { key: "users", icon: Users, label: "Usuários", color: "text-green-600" },
  { key: "customers", icon: UserCircle, label: "Clientes", color: "text-purple-600" },
  { key: "devices", icon: Smartphone, label: "Equipamentos", color: "text-orange-600" },
  { key: "technicians", icon: Wrench, label: "Técnicos", color: "text-cyan-600" },
  { key: "serviceOrders", icon: FileText, label: "Ordens de Serviço", color: "text-indigo-600" },
  { key: "returns", icon: Replace, label: "Retornos", color: "text-rose-600" },
  { key: "warranties", icon: ShieldCheck, label: "Garantias", color: "text-emerald-600" },
  { key: "payments", icon: DollarSign, label: "Pagamentos", color: "text-yellow-600" },
  { key: "documents", icon: Layers, label: "Documentos", color: "text-teal-600" },
  { key: "events", icon: Zap, label: "Eventos", color: "text-violet-600" },
  { key: "workflows", icon: Workflow, label: "Workflows", color: "text-sky-600" },
  { key: "audits", icon: ScrollText, label: "Auditorias", color: "text-pink-600" },
  { key: "integrations", icon: Cable, label: "Integrações", color: "text-lime-600" },
  { key: "reports", icon: BarChart3, label: "Relatórios", color: "text-amber-600" },
  { key: "dashboards", icon: LayoutDashboard, label: "Dashboards", color: "text-fuchsia-600" },
];

export const Route = createFileRoute("/_app/admin/demo-env/statistics")({
  component: DemoEnvStatisticsPage,
});

function DemoEnvStatisticsPage() {
  const { t } = useTranslation();

  const { data: stats } = useQuery({
    queryKey: ["demo-env", "stats"],
    queryFn: () => demoEnvService.getStats(),
  });

  const totalRecords = stats
    ? Object.entries(stats).reduce((a, [k, v]) => a + (typeof v === "number" ? v : 0), 0)
    : 0;

  const numericStats = stats
    ? statCards.map((s) => ({ ...s, value: (stats as any)[s.key] as number ?? 0 }))
    : [];

  const maxValue = Math.max(...numericStats.map((s) => s.value), 1);

  const timelineItems = stats
    ? [
        { label: "Última Geração", value: stats.lastGeneration },
        { label: "Última Limpeza", value: stats.lastClean },
        { label: "Última Importação", value: stats.lastImport },
        { label: "Última Exportação", value: stats.lastExport },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Estatísticas do Ambiente</h1>
            <DocButton module="demo-env" page="statistics" title="Estatísticas" />
          </div>
          <p className="text-sm text-muted-foreground">Volume de dados e distribuição do ambiente de demonstração</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {numericStats.map((s) => (
          <Card key={s.key} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">{(s.value).toLocaleString("pt-BR")}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Distribuição de Dados</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {numericStats.sort((a, b) => b.value - a.value).map((s) => {
              const pct = maxValue > 0 ? (s.value / maxValue) * 100 : 0;
              return (
                <div key={s.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                      <span>{s.label}</span>
                    </div>
                    <span className="font-medium tabular-nums">{(s.value).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.max(pct, 0.5)}%`, backgroundColor: s.color.replace("text-", "bg-").replace("600", "500") }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Resumo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de Registros</span>
                <span className="text-2xl font-bold">{(totalRecords).toLocaleString("pt-BR")}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Entidades</span>
                <span className="text-xl font-bold">{statCards.length}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Média por Entidade</span>
                <span className="text-xl font-bold">{statCards.length > 0 ? Math.round(totalRecords / statCards.length).toLocaleString("pt-BR") : 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Linha do Tempo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {timelineItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value ? new Date(item.value).toLocaleString("pt-BR") : "Nunca"}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
