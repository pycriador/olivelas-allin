import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, CirclePlus, Edit, Save, Search, TriangleAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { aiPromptsService } from "@/services/ai-data";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const promptSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  category: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  systemPrompt: z.string().optional().or(z.literal("")),
  prompt: z.string().min(1, "Informe o prompt"),
  temperature: z.coerce.number().min(0).max(2),
  suggestedModel: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  status: z.string(),
});

type PromptFormValues = z.infer<typeof promptSchema>;

const STATUS_TONE: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  archived: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export function AIPromptsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceId = workspace?.id;
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["ai", "prompts", workspaceId],
    queryFn: () => aiPromptsService.listByWorkspace(workspaceId ?? null),
    enabled: !!workspaceId,
  });

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      systemPrompt: "",
      prompt: "",
      temperature: 0.7,
      suggestedModel: "",
      tags: "",
      status: "draft",
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["ai", "prompts", workspaceId] });

  const savePrompt = useMutation({
    mutationFn: async (values: PromptFormValues) => {
      const tags = values.tags
        ? values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      if (editing) {
        return aiPromptsService.update(editing, {
          name: values.name,
          category: values.category || null,
          description: values.description || null,
          systemPrompt: values.systemPrompt || "",
          prompt: values.prompt,
          temperature: Number(values.temperature),
          suggestedModel: values.suggestedModel || null,
          tags,
          status: values.status as "draft" | "published" | "archived",
          authorId: userId || null,
        });
      }
      return aiPromptsService.create({
        workspaceId: workspaceId ?? null,
        name: values.name,
        category: values.category || null,
        description: values.description || null,
        systemPrompt: values.systemPrompt || null,
        prompt: values.prompt,
        temperature: Number(values.temperature),
        suggestedModel: values.suggestedModel || null,
        tags,
        status: values.status as "draft" | "published" | "archived",
        authorId: userId || null,
      });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? "Prompt atualizado" : "Prompt criado");
      form.reset();
      setEditing(null);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Erro ao salvar prompt"),
  });

  const removePrompt = useMutation({
    mutationFn: async (id: string) => aiPromptsService.delete(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("Prompt eliminado");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Erro ao eliminar prompt"),
  });

  const setStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "draft" | "published" | "archived";
    }) => aiPromptsService.setStatus(id, status),
    onSuccess: async () => {
      await invalidate();
      toast.success("Estado atualizado");
    },
  });

  const filtered = prompts?.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q) ||
      (p.tags as string[] | null)?.some((t) => t.toLowerCase().includes(q)) === true
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompt Library"
        description="Gestione prompts reutilizáveis com versionamento e estados."
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
                Novo prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar prompt" : "Novo prompt"}</DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Atualize os dados do prompt. Será guardada uma nova versión."
                    : "Crie um prompt reutilizável para o workspace."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => savePrompt.mutateAsync(v))}>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Resumir contrato" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <FormControl>
                              <Input placeholder="legal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Breve descripción del prompt" {...field} />
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
                            <Textarea placeholder="Você é um assistente jurídico..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="Resume el siguiente contrato: {{texto}}"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags (separadas por coma)</FormLabel>
                            <FormControl>
                              <Input placeholder="legal, resumen" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="suggestedModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modelo sugerido</FormLabel>
                            <FormControl>
                              <Input placeholder="gpt-5.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
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
                                <SelectItem value="draft">Rascunho</SelectItem>
                                <SelectItem value="published">Publicado</SelectItem>
                                <SelectItem value="archived">Arquivado</SelectItem>
                              </SelectContent>
                            </Select>
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
                    <Button type="submit" disabled={savePrompt.isPending}>
                      <Save className="mr-2 size-4" />
                      {savePrompt.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome, tag ou categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {filtered.map((prompt) => (
                <div key={prompt.id} className="flex items-start gap-4 px-6 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{prompt.name}</span>
                      <Badge
                        variant="outline"
                        className={`capitalize ${STATUS_TONE[prompt.status] ?? STATUS_TONE["draft"]}`}
                      >
                        {STATUS_LABEL[prompt.status] ?? prompt.status}
                      </Badge>
                      {prompt.category && <Badge variant="secondary">{prompt.category}</Badge>}
                      <Badge variant="secondary">v{prompt.version}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {prompt.description ?? prompt.prompt}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(prompt.tags as string[] | null)?.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setStatus.mutate({
                          id: prompt.id,
                          status: prompt.status === "published" ? "draft" : "published",
                        })
                      }
                    >
                      {prompt.status === "published" ? "Arquivar" : "Publicar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(prompt.id);
                        form.reset({
                          name: prompt.name,
                          category: prompt.category ?? "",
                          description: prompt.description ?? "",
                          systemPrompt: prompt.system_prompt ?? "",
                          prompt: prompt.prompt,
                          temperature: prompt.temperature,
                          suggestedModel: prompt.suggested_model ?? "",
                          tags: (prompt.tags as string[] | null)?.join(", ") ?? "",
                          status: prompt.status,
                        });
                      }}
                    >
                      <Edit className="mr-1 size-4" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removePrompt.mutate(prompt.id)}
                    >
                      <TriangleAlert className="mr-1 size-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={BrainCircuit}
          title="Não há prompts"
          description="Cree o primeiro para começar a biblioteca de prompts do workspace."
        />
      )}
    </div>
  );
}
