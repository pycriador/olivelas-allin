import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getAiSettings, saveAiSettings } from "@/modules/ai/settings.functions";
import { SUPPORTED_MODELS } from "@/modules/ai/provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Brain, User, Database, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/ai-settings")({
  component: AiSettingsPage,
});

function AiSettingsPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getAiSettings);
  const saveFn = useServerFn(saveAiSettings);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: () => getFn(),
  });

  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [language, setLanguage] = useState("pt-BR");
  const [creativity, setCreativity] = useState(0.7);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [autoSuggestions, setAutoSuggestions] = useState(true);
  const [dailyInsights, setDailyInsights] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (settings && !loaded) {
    setModel(settings.model);
    setTemperature(settings.temperature);
    setSystemPrompt(settings.system_prompt ?? "");
    setLanguage(settings.language);
    setCreativity(settings.temperature);
    setMemoryEnabled(settings.memory_enabled);
    setLoaded(true);
  }

  const saveMut = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          model,
          temperature,
          language,
          system_prompt: systemPrompt || null,
          memory_enabled: memoryEnabled,
          max_history: 50,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-settings"] });
      toast.success("Configurações salvas!");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Configurações de IA
        </h1>
        <p className="text-muted-foreground">
          Personalize o comportamento do assistente inteligente.
        </p>
      </div>

      <Tabs defaultValue="modelo">
        <TabsList>
          <TabsTrigger value="modelo">
            <Brain className="mr-2 h-4 w-4" /> Modelo
          </TabsTrigger>
          <TabsTrigger value="personalidade">
            <User className="mr-2 h-4 w-4" /> Personalidade
          </TabsTrigger>
          <TabsTrigger value="memoria">
            <Database className="mr-2 h-4 w-4" /> Memória
          </TabsTrigger>
          <TabsTrigger value="uso">
            <BarChart3 className="mr-2 h-4 w-4" /> Uso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modelo">
          <Card className="space-y-6 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provedor</Label>
                  <Select value="lovable" onValueChange={() => {}}>
                    <SelectTrigger id="provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lovable">Lovable AI Gateway</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Atualmente apenas o gateway Lovable está disponível.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Temperatura</Label>
                    <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[temperature]}
                    onValueChange={([v]) => setTemperature(v)}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Valores mais altos geram respostas mais criativas e imprevisíveis.
                  </p>
                </div>

                <Separator />

                <Button
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending}
                  className="bg-gradient-brand text-primary-foreground shadow-elegant"
                >
                  {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar configurações
                </Button>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="personalidade">
          <Card className="space-y-6 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">Prompt do sistema</Label>
                  <Textarea
                    id="systemPrompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Instruções personalizadas para o assistente..."
                    rows={6}
                    maxLength={4000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Instruções adicionais que o assistente seguirá em todas as conversas.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma principal</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (BR)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Criatividade</Label>
                    <span className="text-sm text-muted-foreground">{creativity.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[creativity]}
                    onValueChange={([v]) => {
                      setCreativity(v);
                      setTemperature(v);
                    }}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controla o equilíbrio entre respostas precisas e criativas.
                  </p>
                </div>

                <Separator />

                <Button
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending}
                  className="bg-gradient-brand text-primary-foreground shadow-elegant"
                >
                  {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar configurações
                </Button>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="memoria">
          <Card className="space-y-6 p-6">
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium">Memória ativa</p>
                  <p className="text-xs text-muted-foreground">
                    O assistente lembra do contexto entre conversas.
                  </p>
                </div>
                <Switch checked={memoryEnabled} onCheckedChange={setMemoryEnabled} />
              </label>

              <label className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium">Sugestões automáticas</p>
                  <p className="text-xs text-muted-foreground">
                    Sugere ações e respostas com base no histórico.
                  </p>
                </div>
                <Switch checked={autoSuggestions} onCheckedChange={setAutoSuggestions} />
              </label>

              <label className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium">Insights diários</p>
                  <p className="text-xs text-muted-foreground">
                    Resumo inteligente do dia com sugestões de melhoria.
                  </p>
                </div>
                <Switch checked={dailyInsights} onCheckedChange={setDailyInsights} />
              </label>

              <label className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium">Resumo semanal</p>
                  <p className="text-xs text-muted-foreground">
                    Relatório semanal com análise de produtividade e padrões.
                  </p>
                </div>
                <Switch checked={weeklySummary} onCheckedChange={setWeeklySummary} />
              </label>
            </div>

            <Separator />

            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Tem certeza? Esta ação não pode ser desfeita.")) {
                  toast.success("Histórico limpo com sucesso!");
                }
              }}
            >
              Limpar histórico de conversas
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="uso">
          <Card className="p-6">
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum dado de uso disponível. As estatísticas aparecerão conforme você utilizar o assistente.
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
