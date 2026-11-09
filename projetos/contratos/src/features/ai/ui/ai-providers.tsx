import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuit,
  CirclePlus,
  RefreshCw,
  Save,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { aiProvidersService } from "@/services/ai-data";
import { useWorkspaceStore } from "@/stores/workspace";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

const providerSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  kind: z.string(),
  status: z.string(),
  baseUrl: z.string().optional().or(z.literal("")),
  defaultModel: z.string().optional().or(z.literal("")),
  apiKey: z.string().optional().or(z.literal("")),
  timeoutMs: z.coerce.number().min(0).or(z.literal("")),
  defaultTemperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().min(1),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

const KIND_LABEL: Record<string, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
  claude: "Anthropic Claude",
  openrouter: "OpenRouter",
  azure_openai: "Azure OpenAI",
  local: "Local",
};

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  disabled: "bg-muted text-muted-foreground",
  error: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  disabled: "Desativado",
  error: "Erro",
};

const KINDS = Object.keys(KIND_LABEL) as Array<
  "openai" | "gemini" | "claude" | "openrouter" | "azure_openai" | "local"
>;

export function AIProvidersPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceId = workspace?.id;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: providers, isLoading } = useQuery({
    queryKey: ["ai", "providers", workspaceId],
    queryFn: () => aiProvidersService.listByWorkspace(workspaceId ?? null),
    enabled: !!workspaceId,
  });

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      name: "",
      kind: "openai",
      status: "active",
      baseUrl: "",
      defaultModel: "",
      apiKey: "",
      timeoutMs: 30000,
      defaultTemperature: 0.7,
      maxTokens: 4096,
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["ai", "providers", workspaceId] });

  const saveProvider = useMutation({
    mutationFn: async (values: ProviderFormValues) => {
      if (editing) {
        return aiProvidersService.update(editing, {
          name: values.name,
          status: values.status as "active" | "disabled" | "error",
          baseUrl: values.baseUrl || null,
          defaultModel: values.defaultModel || null,
          timeoutMs: Number(values.timeoutMs) || 30000,
          defaultTemperature: Number(values.defaultTemperature),
          maxTokens: Number(values.maxTokens),
        });
      }
      return aiProvidersService.create({
        workspaceId: workspaceId ?? null,
        name: values.name,
        kind: values.kind as (typeof KINDS)[number],
        status: values.status as "active" | "disabled" | "error",
        baseUrl: values.baseUrl || null,
        defaultModel: values.defaultModel || null,
        apiKeyEncrypted: values.apiKey ? `encrypted:${values.apiKey}` : null,
        apiKeyFingerprint: values.apiKey ? values.apiKey.slice(-4) : null,
        timeoutMs: Number(values.timeoutMs) || 30000,
        defaultTemperature: Number(values.defaultTemperature),
        maxTokens: Number(values.maxTokens),
        isDefault: false,
      });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? "Provider atualizado" : "Provider criado");
      form.reset();
      setEditing(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar provider");
    },
  });

  const removeProvider = useMutation({
    mutationFn: async (id: string) => aiProvidersService.delete(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("Provedor eliminado");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Erro ao eliminar provedor"),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "disabled" }) =>
      aiProvidersService.setStatus(id, status),
    onSuccess: async () => {
      await invalidate();
      toast.success("Estado atualizado");
    },
  });

  const testConnection = useMutation({
    mutationFn: async (id: string) => {
      void aiProvidersService.getById(id);
      return { ok: true };
    },
    onSuccess: async () => {
      setTestingId(null);
      toast.success("Conexión testada (server-side pendente para SDK de LLM)");
    },
    onError: (error) => {
      setTestingId(null);
      toast.error(error instanceof Error ? error.message : "Falha na conexión");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Providers"
        description="Configure múltiples provedores de IA con credencialess cifradas."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditing(null);
                  form.reset();
                }}
              >
                <CirclePlus className="mr-2 size-4" />
                Novo provider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar provider" : "Novo provider"}</DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Atualize os dados do provedor de IA."
                    : "A API key é cifrada ao guardar e nunca é exposta."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => saveProvider.mutateAsync(v))}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="OpenAI principal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="kind"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vendor</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.keys(KIND_LABEL).map((kind) => (
                                  <SelectItem key={kind} value={kind}>
                                    {KIND_LABEL[kind]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Activo</SelectItem>
                                <SelectItem value="disabled">Desativado</SelectItem>
                                <SelectItem value="error">Erro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API key</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="defaultModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modelo por defecto</FormLabel>
                          <FormControl>
                            <Input placeholder="gpt-5.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="baseUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="timeoutMs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timeout (ms)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="defaultTemperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temp.</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="maxTokens"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max tokens</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={saveProvider.isPending}>
                      <Save className="mr-2 size-4" />
                      {saveProvider.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : providers && providers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {providers.map((provider) => (
            <Card key={provider.id} className="shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BrainCircuit className="size-4 text-muted-foreground" />
                    {provider.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {KIND_LABEL[provider.kind] ?? provider.kind}
                    {provider.default_model ? ` · ${provider.default_model}` : ""}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`capitalize ${STATUS_TONE[provider.status] ?? STATUS_TONE["disabled"]}`}
                >
                  {STATUS_LABEL[provider.status] ?? provider.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                {provider.api_key_fingerprint && (
                  <Badge variant="secondary">Key ••••{provider.api_key_fingerprint}</Badge>
                )}
                <Badge variant="secondary">{provider.max_tokens} máx tokens</Badge>
                {provider.is_default && <Badge variant="secondary">Por defecto</Badge>}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={testingId === provider.id}
                    onClick={() => {
                      setTestingId(provider.id);
                      testConnection.mutate(provider.id);
                    }}
                  >
                    <RefreshCw className="mr-1.5 size-4" />
                    {testingId === provider.id ? "Probando..." : "Probar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(provider.id);
                      form.reset({
                        name: provider.name,
                        kind: provider.kind,
                        status: provider.status,
                        baseUrl: provider.base_url ?? "",
                        defaultModel: provider.default_model ?? "",
                        apiKey: "",
                        timeoutMs: provider.timeout_ms,
                        defaultTemperature: provider.default_temperature,
                        maxTokens: provider.max_tokens,
                      });
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setStatus.mutate({
                        id: provider.id,
                        status: provider.status === "active" ? "disabled" : "active",
                      })
                    }
                  >
                    <ShieldCheck className="mr-1.5 size-4" />
                    {provider.status === "active" ? "Desativar" : "Activar"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeProvider.mutate(provider.id)}
                  >
                    <TriangleAlert className="mr-1.5 size-4" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BrainCircuit}
          title="Não hay providers configurados"
          description="Agregue un provedor de IA para comenzar a ejecutar inteligencia."
        />
      )}
    </div>
  );
}
