import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Save, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { metadataConfigService, metadataEntityService, metadataFormService, metadataViewService, metadataDashboardService, metadataTemplateService, metadataVersionService } from "@/modules/metadata/service";
import { DocButton } from "@/components/doc-button";
import { runMetadataSeeds } from "@/modules/metadata/seeds";

export const Route = createFileRoute("/_app/admin/metadata/config")({
  head: () => ({ meta: [{ title: "Configuration Center — ServiceForge" }] }),
  component: ConfigCenterPage,
});

function ConfigCenterPage() {
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  const { data: config } = useQuery({ queryKey: ["metadata", "config"], queryFn: () => metadataConfigService.get() });
  const { data: entities } = useQuery({ queryKey: ["metadata", "entities"], queryFn: () => metadataEntityService.list() });
  const { data: forms } = useQuery({ queryKey: ["metadata", "forms"], queryFn: () => metadataFormService.list() });
  const { data: views } = useQuery({ queryKey: ["metadata", "views"], queryFn: () => metadataViewService.list() });
  const { data: dashboards } = useQuery({ queryKey: ["metadata", "dashboards"], queryFn: () => metadataDashboardService.list() });
  const { data: templates } = useQuery({ queryKey: ["metadata", "templates"], queryFn: () => metadataTemplateService.list() });
  const { data: versions } = useQuery({ queryKey: ["metadata", "versions"], queryFn: () => metadataVersionService.list() });

  const updateMut = useMutation({
    mutationFn: (patch: Record<string, unknown>) => metadataConfigService.update(patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "config"] }); toast.success("Configuração salva"); },
  });

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await runMetadataSeeds();
      qc.invalidateQueries();
      toast.success("Dados de seed carregados");
    } catch (e) {
      toast.error("Erro ao carregar seeds");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Configuration Center</h1>
          <DocButton module="admin" page="config" title="Configuration Center" />
        </div>
        <p className="text-sm text-muted-foreground">Central de configuração da Metadata Platform</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Configurações Gerais</CardTitle><CardDescription>Configurações globais da Metadata Platform</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máx. Versões</Label>
                  <Input type="number" defaultValue={config?.maxVersions ?? 50} onBlur={(e) => updateMut.mutate({ maxVersions: parseInt(e.target.value) || 50 })} />
                </div>
                <div className="space-y-2">
                  <Label>Nível Padrão</Label>
                  <Input defaultValue={config?.defaultLevel ?? "global"} onBlur={(e) => updateMut.mutate({ defaultLevel: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked={config?.versioningEnabled ?? true} onCheckedChange={(v) => updateMut.mutate({ versioningEnabled: v })} />
                <Label>Versionamento Habilitado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked={config?.autoPublish ?? false} onCheckedChange={(v) => updateMut.mutate({ autoPublish: v })} />
                <Label>Auto Publicação</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked={config?.requireApproval ?? true} onCheckedChange={(v) => updateMut.mutate({ requireApproval: v })} />
                <Label>Exigir Aprovação</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked={config?.inheritEnabled ?? true} onCheckedChange={(v) => updateMut.mutate({ inheritEnabled: v })} />
                <Label>Herança Habilitada</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Cache</CardTitle><CardDescription>Gerencie o cache de metadados</CardDescription></CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" onClick={() => { qc.invalidateQueries({ queryKey: ["metadata"] }); toast.success("Cache invalidado"); }}>
                <RefreshCw className="mr-2 h-4 w-4" />Invalidar React Query
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Feature Flags</CardTitle><CardDescription>Ative/desative funcionalidades da Metadata Platform</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {[
                { key: "versioningEnabled", label: "Versionamento", desc: "Habilitar versionamento de metadados" },
                { key: "autoPublish", label: "Auto Publicação", desc: "Publicar automaticamente após salvar" },
                { key: "requireApproval", label: "Exigir Aprovação", desc: "Exigir aprovação antes de publicar" },
                { key: "inheritEnabled", label: "Herança", desc: "Resolver herança global → company → user" },
              ].map((feat) => (
                <div key={feat.key} className="flex items-start gap-3 border rounded-md p-3">
                  <Switch defaultChecked={(config as any)?.[feat.key] ?? false} onCheckedChange={(v) => updateMut.mutate({ [feat.key]: v })} />
                  <div><div className="font-medium text-sm">{feat.label}</div><div className="text-xs text-muted-foreground">{feat.desc}</div></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Status do Sistema</CardTitle><CardDescription>Visão geral dos metadados carregados</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Entidades", value: entities?.length ?? 0, color: "text-blue-500" },
                  { label: "Formulários", value: forms?.length ?? 0, color: "text-green-500" },
                  { label: "Visualizações", value: views?.length ?? 0, color: "text-purple-500" },
                  { label: "Dashboards", value: dashboards?.length ?? 0, color: "text-orange-500" },
                  { label: "Templates", value: templates?.length ?? 0, color: "text-pink-500" },
                  { label: "Versões", value: versions?.length ?? 0, color: "text-cyan-500" },
                ].map((stat) => (
                  <div key={stat.label} className="border rounded-md p-4 text-center">
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Gerenciamento de Dados</CardTitle><CardDescription>Operações de manutenção da Metadata Platform</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border rounded-md p-4">
                <div><div className="font-medium text-sm">Carregar Seeds</div><div className="text-xs text-muted-foreground">Cria dados iniciais (15 entidades, 200 campos, etc.)</div></div>
                <Button variant="outline" onClick={handleSeed} disabled={seeding}>
                  {seeding ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {seeding ? "Carregando..." : "Executar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
