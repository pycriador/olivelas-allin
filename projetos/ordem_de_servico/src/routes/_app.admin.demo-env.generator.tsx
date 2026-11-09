import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Building, Users, UserCircle, Smartphone, Wrench, FileText, DollarSign, ShieldCheck, Replace, Zap, ScrollText, Workflow, Layers, BarChart3, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { demoEnvService } from "@/modules/demo-env/service";
import { DEFAULT_CUSTOM_CONFIG, type CustomGeneratorConfig } from "@/modules/demo-env/types";

interface SliderField {
  key: keyof CustomGeneratorConfig;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  min: number;
  max: number;
  step: number;
  color: string;
}

const fields: SliderField[] = [
  { key: "companies", label: "Empresas", icon: Building, min: 0, max: 50, step: 1, color: "text-blue-600" },
  { key: "users", label: "Usuários", icon: Users, min: 0, max: 500, step: 1, color: "text-green-600" },
  { key: "customers", label: "Clientes", icon: UserCircle, min: 0, max: 20000, step: 100, color: "text-purple-600" },
  { key: "devices", label: "Equipamentos", icon: Smartphone, min: 0, max: 30000, step: 100, color: "text-orange-600" },
  { key: "technicians", label: "Técnicos", icon: Wrench, min: 0, max: 500, step: 1, color: "text-cyan-600" },
  { key: "serviceOrders", label: "Ordens de Serviço", icon: FileText, min: 0, max: 60000, step: 100, color: "text-indigo-600" },
  { key: "payments", label: "Pagamentos", icon: DollarSign, min: 0, max: 40000, step: 100, color: "text-yellow-600" },
  { key: "warranties", label: "Garantias", icon: ShieldCheck, min: 0, max: 10000, step: 50, color: "text-emerald-600" },
  { key: "returns", label: "Retornos", icon: Replace, min: 0, max: 5000, step: 10, color: "text-rose-600" },
  { key: "events", label: "Eventos", icon: Zap, min: 0, max: 500000, step: 1000, color: "text-violet-600" },
  { key: "audits", label: "Auditorias", icon: ScrollText, min: 0, max: 50000, step: 100, color: "text-pink-600" },
  { key: "workflows", label: "Workflows", icon: Workflow, min: 0, max: 500, step: 1, color: "text-sky-600" },
  { key: "documents", label: "Documentos", icon: Layers, min: 0, max: 150000, step: 100, color: "text-teal-600" },
  { key: "reports", label: "Relatórios", icon: BarChart3, min: 0, max: 100, step: 1, color: "text-amber-600" },
  { key: "dashboards", label: "Dashboards", icon: LayoutDashboard, min: 0, max: 50, step: 1, color: "text-fuchsia-600" },
];

export const Route = createFileRoute("/_app/admin/demo-env/generator")({
  component: DemoEnvGeneratorPage,
});

function DemoEnvGeneratorPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [config, setConfig] = useState<CustomGeneratorConfig>({ ...DEFAULT_CUSTOM_CONFIG });

  const updateField = (key: keyof CustomGeneratorConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const totalRecords = Object.values(config).reduce((a, b) => a + b, 0);

  const generateMut = useMutation({
    mutationFn: () => demoEnvService.generateCustom(config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demo-env"] });
      toast.success("Ambiente personalizado gerado com sucesso!");
    },
    onError: () => toast.error("Erro ao gerar ambiente personalizado"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Gerador Personalizado</h1>
            <DocButton module="demo-env" page="generator" title="Gerador Personalizado" />
          </div>
          <p className="text-sm text-muted-foreground">Gere um ambiente de demonstração com volumes personalizados</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground text-right">
            <div className="font-medium text-foreground">{(totalRecords).toLocaleString("pt-BR")}</div>
            <div>registros</div>
          </div>
          <Button onClick={() => generateMut.mutate()} disabled={generateMut.isPending} size="lg">
            <Play className="mr-2 h-4 w-4" />{generateMut.isPending ? "Gerando..." : "Gerar Ambiente"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volumes por Entidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((f) => (
              <div key={f.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <f.icon className={`h-4 w-4 ${f.color}`} />
                    {f.label}
                  </Label>
                  <Input
                    type="number"
                    value={config[f.key]}
                    onChange={(e) => updateField(f.key, Math.max(f.min, Math.min(f.max, Number(e.target.value) || 0)))}
                    className="w-24 h-8 text-sm text-right"
                    min={f.min}
                    max={f.max}
                  />
                </div>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={config[f.key]}
                  onChange={(e) => updateField(f.key, Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{f.min.toLocaleString("pt-BR")}</span>
                  <span>{f.max.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo da Geração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {fields.map((f) => (
              <div key={f.key} className="flex items-center gap-2 text-sm">
                <f.icon className={`h-4 w-4 ${f.color}`} />
                <span className="text-muted-foreground">{f.label}:</span>
                <strong>{(config[f.key]).toLocaleString("pt-BR")}</strong>
              </div>
            ))}
            <Separator className="col-span-full" />
            <div className="col-span-full flex items-center justify-between text-sm font-medium">
              <span>Total de Registros</span>
              <span className="text-lg">{(totalRecords).toLocaleString("pt-BR")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
