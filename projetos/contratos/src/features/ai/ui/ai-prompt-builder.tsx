import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Blocks, Eye, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { aiPromptsService, aiProvidersService } from "@/services/ai-data";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";

const builderSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
  systemPrompt: z.string().optional().or(z.literal("")),
  prompt: z.string().min(1, "Informe o prompt"),
  temperature: z.coerce.number().min(0).max(2),
  suggestedModel: z.string().optional().or(z.literal("")),
});

type BuilderFormValues = z.infer<typeof builderSchema>;

const TEMPLATES: Array<{ title: string; prompt: string }> = [
  {
    title: "Resumir contrato",
    prompt:
      "Resuma el siguiente contrato de forma ejecutiva. Destaca partes, obligaciones, fechas y riesgos principales:\n\n{{texto}}",
  },
  {
    title: "Detectar riesgos",
    prompt:
      "Analice el contrato y enumere cláusulas de riesgo, contradicciones e inconsistencias:\n\n{{texto}}",
  },
  {
    title: "Revisar lenguaje",
    prompt:
      "Revise la redacción del texto: ortografía, gramática, tono jurídico y formalidad:\n\n{{texto}}",
  },
];

function renderVariables(prompt: string) {
  const vars = Array.from(
    new Set([...prompt.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((m) => m[1])),
  );
  let html = prompt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  for (const v of vars) {
    html = html.replace(
      new RegExp(`\\{\\{${v}\\}\\}`, "g"),
      `<mark class="rounded bg-primary/10 text-primary px-1">${v}</mark>`,
    );
  }
  return html;
}

export function AIPromptBuilderPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const workspaceId = workspace?.id;
  const userId = useAuthStore((s) => s.session?.user.id);

  const form = useForm<BuilderFormValues>({
    resolver: zodResolver(builderSchema),
    defaultValues: {
      name: "",
      systemPrompt: "",
      prompt: "",
      temperature: 0.7,
      suggestedModel: "",
    },
  });

  const savePrompt = useMutation({
    mutationFn: async (values: BuilderFormValues) => {
      const slug = values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      return aiPromptsService.create({
        workspaceId: workspaceId ?? null,
        name: values.name,
        slug,
        systemPrompt: values.systemPrompt || null,
        prompt: values.prompt,
        temperature: Number(values.temperature),
        suggestedModel: values.suggestedModel || null,
        status: "draft",
        authorId: userId || null,
      });
    },
    onSuccess: () => {
      toast.success("Prompt guardado na biblioteca");
      form.reset();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Erro ao guardar prompt"),
  });

  const applyTemplate = (template: string) => {
    form.setValue("prompt", template);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompt Builder"
        description="Edite prompts com preview de variáveis e publique-os na biblioteca."
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" onClick={() => savePrompt.mutate(form.getValues())}>
              <Save className="mr-2 size-4" />
              Guardar en librería
            </Button>
          </div>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => savePrompt.mutate(v))} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
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
          </div>

          <FormField
            control={form.control}
            name="systemPrompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>System prompt</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Você é um assistente jurídico..." {...field} />
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
                  <Textarea rows={8} className="font-mono text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2">
                <Blocks className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {TEMPLATES.map((t) => (
                  <div
                    key={t.title}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <Button variant="outline" size="sm" onClick={() => applyTemplate(t.prompt)}>
                      Usar
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2">
                <Eye className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 p-3 text-sm"
                  dangerouslySetInnerHTML={{
                    __html: renderVariables(form.getValues().prompt ?? ""),
                  }}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Use {"{{variable}}"} para variáveis reutilizáveis.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={savePrompt.isPending}>
              <Save className="mr-2 size-4" />
              {savePrompt.isPending ? "Guardando..." : "Guardar prompt"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
