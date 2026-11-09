import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, CirclePlus, Edit, Save, TriangleAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { aiAgentsService, aiToolsService } from "@/services/ai-data";
import { useWorkspaceStore } from "@/stores/workspace";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

const agentSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  key: z.string().min(1, "Informe a key"),
  objective: z.string().optional().or(z.literal("")),
  systemPrompt: z.string().optional().or(z.literal("")),
  model: z.string().optional().or(z.literal("")),
  temperature: z.coerce.number().min(0).max(2),
  status: z.string(),
});

type AgentFormValues = z.infer<typeof agentSchema>;

const STATUS_TONE: Record<string, string> = {
  enabled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  disabled: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  enabled: "Ativo",
  disabled: "Desativado",
};

export function AIAgentsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceId = workspace?.id;
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const { data: agents, isLoading } = useQuery({
    queryKey: ["ai", "agents", workspaceId],
    queryFn: () => aiAgentsService.listForWorkspace(workspaceId ?? null),
    enabled: !!workspaceId,
  });

  const { data: tools } = useQuery({
    queryKey: ["ai", "tools"],
    queryFn: () => aiToolsService.list(),
  });

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: "",
      key: "",
      objective: "",
      systemPrompt: "",
      model: "",
      temperature: 0.7,
      status: "enabled",
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["ai", "agents", workspaceId] });

  const saveAgent = useMutation({
    mutationFn: async (values: AgentFormValues) => {
      if (editing) {
        return aiAgentsService.update(editing, {
          name: values.name,
          objective: values.objective || null,
          systemPrompt: values.systemPrompt || "",
          tools: selectedTools,
          model: values.model || null,
          temperature: Number(values.temperature),
          status: values.status as "enabled" | "disabled",
        });
      }
      return aiAgentsService.create({
        workspaceId: workspaceId ?? null,
        name: values.name,
        key: values.key,
        objective: values.objective || null,
        systemPrompt: values.systemPrompt || null,
        tools: selectedTools,
        model: values.model || null,
        temperature: Number(values.temperature),
        status: values.status as "enabled" | "disabled",
      });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? "Agente atualizado" : "Agente criado");
      form.reset();
      setEditing(null);
      setSelectedTools([]);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Erro ao salvar agente"),
  });

  const removeAgent = useMutation({
    mutationFn: async (id: string) => aiAgentsService.delete(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("Agente eliminado");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Agents"
        description="Agentes especializados que ejecutan tareas de IA com herramientas."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditing(null);
                  form.reset();
                  setSelectedTools([]);
                }}
              >
                <CirclePlus className="mr-2 size-4" />
                Novo agente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar agente" : "Novo agente"}</DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Actualice los datos del agente."
                    : "Crie um agente especializado com ferramentas habilitadas."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => saveAgent.mutateAsync(v))}>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Revisor jurídico" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key</FormLabel>
                            <FormControl>
                              <Input placeholder="legal_reviewer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="objective"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objetivo</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={2}
                              placeholder="Revisar cláusulas de contratos..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="systemPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Você é um advogado experto..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modelo</FormLabel>
                            <FormControl>
                              <Input placeholder="gpt-5.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temperatura</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
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
                                <SelectItem value="enabled">Ativo</SelectItem>
                                <SelectItem value="disabled">Desativado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormLabel>Ferramentas</FormLabel>
                      <div className="mt-1 grid gap-2 sm:grid-cols-2">
                        {tools?.map((tool) => (
                          <label
                            key={tool.id}
                            className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                          >
                            <Checkbox
                              checked={selectedTools.some((k) => k === tool.key)}
                              onCheckedChange={(v) => {
                                const next = v
                                  ? [...selectedTools, tool.key]
                                  : selectedTools.filter((k) => k !== tool.key);
                                setSelectedTools(next);
                              }}
                            />
                            <span className="min-w-0 flex-1 truncate">{tool.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={saveAgent.isPending}>
                      <Save className="mr-2 size-4" />
                      {saveAgent.isPending ? "Guardando..." : "Guardar"}
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
      ) : agents && agents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {agents.map((agent) => (
            <Card key={agent.id} className="shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bot className="size-4 text-muted-foreground" />
                    {agent.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {agent.objective ?? "Sem objetivo"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`capitalize ${STATUS_TONE[agent.status] ?? STATUS_TONE["disabled"]}`}
                >
                  {STATUS_LABEL[agent.status] ?? agent.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{agent.key}</Badge>
                {agent.model && <Badge variant="secondary">{agent.model}</Badge>}
                <Badge variant="secondary">{agent.temperature} temp</Badge>
                {(agent.tools as string[] | null)?.slice(0, 3).map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
                {((agent.tools as string[] | null)?.length ?? 0) > 3 && (
                  <Badge variant="secondary">+{(agent.tools as string[]).length - 3}</Badge>
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(agent.id);
                      setSelectedTools((agent.tools as string[] | null) ?? []);
                      form.reset({
                        name: agent.name,
                        key: agent.key,
                        objective: agent.objective ?? "",
                        systemPrompt: agent.system_prompt,
                        model: agent.model ?? "",
                        temperature: agent.temperature,
                        status: agent.status,
                      });
                    }}
                  >
                    <Edit className="mr-1 size-4" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeAgent.mutate(agent.id)}
                  >
                    <TriangleAlert className="mr-1 size-4" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bot}
          title="Não hay agentes configurados"
          description="Crie o primeiro para começar a orquestar tarefas de IA."
        />
      )}
    </div>
  );
}
