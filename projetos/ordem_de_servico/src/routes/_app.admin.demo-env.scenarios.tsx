import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Store, Building2, Globe, Play, Clock, Building, Users, UserCircle, Smartphone, Wrench, FileText, Replace, ShieldCheck, DollarSign, BarChart3, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { demoEnvService } from "@/modules/demo-env/service";
import { SCENARIOS, type ScenarioType, type ScenarioDefinition } from "@/modules/demo-env/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { Store, Building2, Globe };

const scenarioColors: Record<ScenarioType, string> = { small: "bg-blue-50 border-blue-200 dark:bg-blue-950/20", medium: "bg-amber-50 border-amber-200 dark:bg-amber-950/20", large: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20" };

const scenarioBadge: Record<ScenarioType, string> = { small: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", large: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" };

export const Route = createFileRoute("/_app/admin/demo-env/scenarios")({
  component: DemoEnvScenariosPage,
});

function DemoEnvScenariosPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDefinition | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const generateMut = useMutation({
    mutationFn: (type: ScenarioType) => demoEnvService.runScenario(type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demo-env"] });
      toast.success("Cenário gerado com sucesso!");
    },
    onError: () => toast.error("Erro ao gerar cenário"),
  });

  const handleGenerate = (scenario: ScenarioDefinition) => {
    setSelectedScenario(scenario);
    setConfirmOpen(true);
  };

  const confirmGenerate = () => {
    if (!selectedScenario) return;
    setConfirmOpen(false);
    generateMut.mutate(selectedScenario.type);
  };

  const statFields: { key: keyof ScenarioDefinition; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { key: "companies", icon: Building, label: "Empresas" },
    { key: "users", icon: Users, label: "Usuários" },
    { key: "customers", icon: UserCircle, label: "Clientes" },
    { key: "devices", icon: Smartphone, label: "Equipamentos" },
    { key: "technicians", icon: Wrench, label: "Técnicos" },
    { key: "serviceOrders", icon: FileText, label: "Ordens" },
    { key: "returns", icon: Replace, label: "Retornos" },
    { key: "warranties", icon: ShieldCheck, label: "Garantias" },
    { key: "payments", icon: DollarSign, label: "Pagamentos" },
    { key: "documents", icon: FileText, label: "Documentos" },
    { key: "reports", icon: BarChart3, label: "Relatórios" },
    { key: "dashboards", icon: LayoutDashboard, label: "Dashboards" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Cenários de Demonstração</h1>
            <DocButton module="demo-env" page="scenarios" title="Cenários" />
          </div>
          <p className="text-sm text-muted-foreground">Cenários pré-definidos para geração de ambiente de demonstração</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {SCENARIOS.map((scenario) => {
          const Icon = iconMap[scenario.icon] || Store;
          return (
            <Card key={scenario.type} className={`${scenarioColors[scenario.type]} border-2`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${scenarioBadge[scenario.type]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {scenario.estimatedTime}
                  </Badge>
                </div>
                <CardTitle className="mt-3">{scenario.label}</CardTitle>
                <CardDescription>{scenario.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {statFields.map((f) => {
                    const val = scenario[f.key] as number;
                    if (val === undefined) return null;
                    return (
                      <div key={f.key} className="flex items-center gap-1.5 text-muted-foreground">
                        <f.icon className="h-3.5 w-3.5" />
                        <span>{f.label}: <strong className="text-foreground">{val.toLocaleString("pt-BR")}</strong></span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleGenerate(scenario)} disabled={generateMut.isPending}>
                  <Play className="mr-2 h-4 w-4" />Gerar Cenário
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Gerar Cenário: ${selectedScenario?.label}`}
        description={`Tem certeza que deseja gerar o cenário "${selectedScenario?.label}"? Os dados operacionais atuais serão substituídos. Esta ação não pode ser desfeita.`}
        confirmText="Gerar"
        onConfirm={confirmGenerate}
      />
    </div>
  );
}
