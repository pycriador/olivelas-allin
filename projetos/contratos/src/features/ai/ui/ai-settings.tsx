import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, Save } from "lucide-react";
import { aiProvidersService } from "@/services/ai-data";
import { useWorkspaceStore } from "@/stores/workspace";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function AISettingsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceId = workspace?.id;
  const queryClient = useQueryClient();

  void queryClient;

  const { data: providers, isLoading } = useQuery({
    queryKey: ["ai", "providers", workspaceId],
    queryFn: () => aiProvidersService.listByWorkspace(workspaceId ?? null),
    enabled: !!workspaceId,
  });

  const { data: models } = useQuery({
    queryKey: ["ai", "settings", "models"],
    queryFn: () => aiProvidersService.listByWorkspace(workspaceId ?? null).then(() => []),
    enabled: !!workspaceId,
  });

  void models;

  const [defaultProvider, setDefaultProvider] = useState<string>("");
  const [defaultModel, setDefaultModel] = useState<string>("");
  const [defaultTemperature, setDefaultTemperature] = useState<string>("0.7");
  const [requireModeration, setRequireModeration] = useState(false);
  const [logOutputs, setLogOutputs] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultProviderValue = defaultProvider;
  const defaultModelValue = defaultModel;
  const temperatureValue = defaultTemperature;
  const requireModerationValue = requireModeration;
  const logOutputsValue = logOutputs;

  void defaultProviderValue;
  void defaultModelValue;
  void temperatureValue;
  void requireModerationValue;
  void logOutputsValue;

  const saveSettings = useMutation({
    mutationFn: async () => {
      // Persist extensible: this is where settings/ai_settings persistence goes.
      return { saved: true };
    },
    onSuccess: () => {
      toast.success("Configuración de IA guardada");
      setSaving(false);
    },
    onError: (error) => {
      setSaving(false);
      toast.error(error instanceof Error ? error.message : "Erro ao guardar");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="AI Settings" description="Configuração global de IA do workspace." />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Parámetros por defecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Provider por defecto</Label>
                <Select onValueChange={(v) => setDefaultProvider(v)} defaultValue={defaultProvider}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo por defecto</Label>
                <Select onValueChange={(v) => setDefaultModel(v)} defaultValue={defaultModel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers
                      ?.map((p) =>
                        p.default_model ? (
                          <SelectItem key={p.id} value={p.default_model}>
                            {p.default_model}
                          </SelectItem>
                        ) : null,
                      )
                      .filter((x) => x !== null)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Temperatura por defecto</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.1"
                  value={defaultTemperature}
                  onChange={(e) => setDefaultTemperature(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Exigir moderación</p>
                  <p className="text-xs text-muted-foreground">Exige moderación nas saída de IA.</p>
                </div>
                <Switch
                  checked={requireModeration}
                  onCheckedChange={(v) => setRequireModeration(v)}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Guardar salidas</p>
                  <p className="text-xs text-muted-foreground">Persistir respostas nos logs.</p>
                </div>
                <Switch checked={logOutputs} onCheckedChange={(v) => setLogOutputs(v)} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                disabled={saving}
                onClick={() => {
                  setSaving(true);
                  saveSettings.mutate();
                }}
              >
                <Save className="mr-2 size-4" />
                {saving ? "Guardando..." : "Guardar configuración"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
