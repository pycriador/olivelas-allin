import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiSettingsRepo } from "@/lib/repositories/ai";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/_authenticated/admin/ai/settings")({
  component: AISettingsPage,
});

const schema = z.object({
  enabled: z.boolean(),
  auto_process_on_upload: z.boolean(),
  language: z.string().min(2),
  max_words: z.coerce.number().int().min(50).max(500),
  temperature: z.coerce.number().min(0).max(1),
  max_retries: z.coerce.number().int().min(1).max(10),
  timeout_ms: z.coerce.number().int().min(10_000).max(180_000),
  chat_model: z.string().min(3),
  embedding_model: z.string().min(3),
});

type Values = z.infer<typeof schema>;

const CHAT_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-pro",
  "google/gemini-3-flash-preview",
  "google/gemini-3.5-flash",
];

const EMBEDDING_MODELS = ["google/gemini-embedding-2", "google/gemini-embedding-001"];

function AISettingsPage() {
  const qc = useQueryClient();
  const settingsQ = useQuery({ queryKey: queryKeys.ai.settings, queryFn: () => aiSettingsRepo.get() });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      enabled: true,
      auto_process_on_upload: true,
      language: "pt-BR",
      max_words: 180,
      temperature: 0.4,
      max_retries: 3,
      timeout_ms: 60_000,
      chat_model: "google/gemini-2.5-flash",
      embedding_model: "google/gemini-embedding-2",
    },
  });

  useEffect(() => {
    if (settingsQ.data) {
      form.reset({
        enabled: settingsQ.data.enabled,
        auto_process_on_upload: settingsQ.data.auto_process_on_upload,
        language: settingsQ.data.language,
        max_words: settingsQ.data.max_words,
        temperature: Number(settingsQ.data.temperature),
        max_retries: settingsQ.data.max_retries,
        timeout_ms: settingsQ.data.timeout_ms,
        chat_model: settingsQ.data.chat_model,
        embedding_model: settingsQ.data.embedding_model,
      });
    }
  }, [settingsQ.data, form]);

  const mut = useMutation({
    mutationFn: (v: Values) => aiSettingsRepo.update(v),
    onSuccess: () => {
      toast.success("Configurações de IA salvas");
      qc.invalidateQueries({ queryKey: queryKeys.ai.settings });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações de IA"
        description="Modelo, idioma, temperatura e limites de execução."
      />

      <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ativação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>IA ativa</Label>
                <p className="text-xs text-muted-foreground">Desativa toda análise automática.</p>
              </div>
              <Switch
                checked={form.watch("enabled")}
                onCheckedChange={(v) => form.setValue("enabled", v, { shouldDirty: true })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Processar ao criar arte</Label>
                <p className="text-xs text-muted-foreground">Analisa a imagem logo após o upload.</p>
              </div>
              <Switch
                checked={form.watch("auto_process_on_upload")}
                onCheckedChange={(v) => form.setValue("auto_process_on_upload", v, { shouldDirty: true })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modelo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Chat (análise multimodal)</Label>
              <Select
                value={form.watch("chat_model")}
                onValueChange={(v) => form.setValue("chat_model", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAT_MODELS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Embeddings (busca semântica)</Label>
              <Select
                value={form.watch("embedding_model")}
                onValueChange={(v) => form.setValue("embedding_model", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMBEDDING_MODELS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geração</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Input {...form.register("language")} />
            </div>
            <div className="space-y-2">
              <Label>Palavras máx.</Label>
              <Input type="number" {...form.register("max_words")} />
            </div>
            <div className="space-y-2">
              <Label>Temperatura</Label>
              <Input type="number" step="0.1" {...form.register("temperature")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confiabilidade</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tentativas máx.</Label>
              <Input type="number" {...form.register("max_retries")} />
            </div>
            <div className="space-y-2">
              <Label>Timeout (ms)</Label>
              <Input type="number" step="1000" {...form.register("timeout_ms")} />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? "Salvando…" : "Salvar configurações de IA"}
          </Button>
        </div>
      </form>
    </div>
  );
}
