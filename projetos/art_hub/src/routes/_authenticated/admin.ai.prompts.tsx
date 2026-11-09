import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { History, Save, RotateCcw, Sparkles, Plus, Trash2, Check, Star } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { aiPromptsRepo, aiSettingsRepo, type AIPromptRow } from "@/lib/repositories/ai";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/ai/prompts")({
  component: PromptsPage,
});

type EditingPrompt = {
  id: string;
  name: string;
  slug: string;
  content: string;
};

function PromptsPage() {
  const qc = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newContent, setNewContent] = useState("");
  const [toDelete, setToDelete] = useState<AIPromptRow | null>(null);
  const [editing, setEditing] = useState<EditingPrompt | null>(null);

  const { data: promptsData, isLoading: promptsLoading } = useQuery({ queryKey: queryKeys.ai.prompts, queryFn: () => aiPromptsRepo.list() });
  const { data: settingsData } = useQuery({ queryKey: queryKeys.ai.settings, queryFn: () => aiSettingsRepo.get() });

  useEffect(() => {
    if (!selectedSlug && promptsData?.length) setSelectedSlug(promptsData[0].slug);
  }, [promptsData, selectedSlug]);

  const current = promptsData?.find((p) => p.slug === selectedSlug);

  useEffect(() => {
    if (current && !editing) setContent(current.content);
  }, [current?.id]);

  useEffect(() => {
    if (!creating) {
      setNewName("");
      setNewSlug("");
      setNewContent("");
    }
  }, [creating]);

  const versionsQ = useQuery({
    queryKey: current ? queryKeys.ai.promptVersions(current.id) : ["ai", "prompts", "none", "versions"],
    queryFn: () => (current ? aiPromptsRepo.versions(current.id) : Promise.resolve([])),
    enabled: !!current,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!current) throw new Error("Nenhum prompt selecionado.");
      const { data: userRes } = await supabase.auth.getUser();
      return aiPromptsRepo.saveNewVersion(current.id, content, note || null, userRes.user?.id);
    },
    onSuccess: () => {
      toast.success("Nova versão salva");
      setNote("");
      qc.invalidateQueries({ queryKey: queryKeys.ai.prompts });
      if (current) qc.invalidateQueries({ queryKey: queryKeys.ai.promptVersions(current.id) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const restoreMut = useMutation({
    mutationFn: async (versionId: string) => {
      if (!current) throw new Error("Nenhum prompt.");
      const { data: userRes } = await supabase.auth.getUser();
      return aiPromptsRepo.restoreVersion(current.id, versionId, userRes.user?.id);
    },
    onSuccess: () => {
      toast.success("Versão restaurada");
      qc.invalidateQueries({ queryKey: queryKeys.ai.prompts });
      if (current) qc.invalidateQueries({ queryKey: queryKeys.ai.promptVersions(current.id) });
    },
  });

  const resetMut = useMutation({
    mutationFn: async () => {
      if (!current) throw new Error("Nenhum prompt.");
      const { data: userRes } = await supabase.auth.getUser();
      return aiPromptsRepo.resetToDefault(current.id, userRes.user?.id);
    },
    onSuccess: () => {
      toast.success("Prompt restaurado para o padrão");
      qc.invalidateQueries({ queryKey: queryKeys.ai.prompts });
    },
  });

  const activateMut = useMutation({
    mutationFn: async (slug: string) => aiSettingsRepo.update({ active_prompt_slug: slug }),
    onSuccess: () => {
      toast.success("Prompt definido como padrão");
      qc.invalidateQueries({ queryKey: queryKeys.ai.settings });
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      return aiPromptsRepo.create({
        name: newName,
        slug: newSlug,
        content: newContent,
        created_by: userRes.user?.id,
      });
    },
    onSuccess: (data) => {
      toast.success("Prompt criado");
      qc.invalidateQueries({ queryKey: queryKeys.ai.prompts });
      setCreating(false);
      setSelectedSlug(data.slug);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => aiPromptsRepo.remove(id),
    onSuccess: () => {
      toast.success("Prompt excluído");
      qc.invalidateQueries({ queryKey: queryKeys.ai.prompts });
      setToDelete(null);
      if (toDelete?.slug === selectedSlug) {
        setSelectedSlug(promptsData?.find((p) => p.slug !== selectedSlug)?.slug ?? null);
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const updateMut = useMutation({
    mutationFn: async (fields: { id: string; name: string; slug: string }) =>
      aiPromptsRepo.update(fields.id, { name: fields.name, slug: fields.slug }),
    onSuccess: () => {
      toast.success("Prompt atualizado");
      qc.invalidateQueries({ queryKey: queryKeys.ai.prompts });
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const isActive = settingsData?.active_prompt_slug === selectedSlug;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gerenciador de Prompts"
        description="Crie, edite e gerencie os prompts usados pela IA."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/ai/monitor">
                <Sparkles className="mr-2 h-4 w-4" /> Monitor
              </Link>
            </Button>
            <Button size="sm" onClick={() => { setCreating(true); setEditing(null); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo prompt
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Prompts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {promptsLoading ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Carregando…</p>
            ) : (promptsData ?? []).length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum prompt</p>
            ) : (promptsData ?? []).map((p) => (
              <div
                key={p.id}
                className={`group flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                  p.slug === selectedSlug ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
              >
                <button type="button" onClick={() => { setSelectedSlug(p.slug); setCreating(false); setEditing(null); }} className="flex-1 text-left">
                  <span className="font-medium">{p.name}</span>
                  {settingsData?.active_prompt_slug === p.slug ? (
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-600">
                      <Star className="h-3 w-3 fill-current" /> padrão
                    </div>
                  ) : null}
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {creating ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Novo prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Padrão" />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="Ex: padrao" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Conteúdo do prompt</Label>
                <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={12} className="font-mono text-xs" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => createMut.mutate()} disabled={createMut.isPending || !newName || !newSlug || !newContent}>
                  <Plus className="mr-2 h-4 w-4" /> Criar
                </Button>
                <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        ) : current ? (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="min-w-0 flex-1">
                  {editing?.id === current.id ? (
                    <div className="flex gap-2">
                      <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-48" />
                      <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="w-40" />
                      <Button size="sm" variant="default" onClick={() => updateMut.mutate({ id: editing.id, name: editing.name, slug: editing.slug })} disabled={updateMut.isPending}>
                        <Check className="mr-1 h-3.5 w-3.5" /> Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{current.name}</CardTitle>
                        {isActive ? <Badge variant="default" className="text-[10px]">padrão</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        v{current.current_version} · slug: <code>{current.slug}</code>
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {editing?.id !== current.id ? (
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ id: current.id, name: current.name, slug: current.slug, content: current.content })}>
                      Editar nome/slug
                    </Button>
                  ) : null}
                  {!isActive ? (
                    <Button size="sm" variant="outline" onClick={() => activateMut.mutate(current.slug)}>
                      <Star className="mr-2 h-3.5 w-3.5" /> Definir como padrão
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => resetMut.mutate()}>
                    <RotateCcw className="mr-2 h-3.5 w-3.5" /> Padrão
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setToDelete(current)}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={18}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis: <code>{"{{language}}"}</code> <code>{"{{max_words}}"}</code>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="note">Nota da versão</Label>
                  <Input
                    id="note"
                    placeholder="Ex: Ajustei o estilo pt-BR"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || content === current.content}>
                  <Save className="mr-2 h-4 w-4" /> Salvar nova versão
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" /> Histórico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(versionsQ.data ?? []).map((v) => (
                  <div key={v.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">v{v.version}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(v.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      {v.note ? <p className="mt-1 text-xs text-muted-foreground">{v.note}</p> : null}
                      <p className="mt-2 line-clamp-2 text-xs">{v.content}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => restoreMut.mutate(v.id)}
                      disabled={v.version === current.current_version}
                    >
                      Restaurar
                    </Button>
                  </div>
                ))}
                {!versionsQ.data?.length ? (
                  <p className="text-sm text-muted-foreground">Sem versões anteriores.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Excluir "${toDelete?.name ?? ""}"?`}
        description="Esta ação não pode ser desfeita. Todas as versões deste prompt serão removidas."
        destructive
        confirmLabel="Excluir"
        loading={deleteMut.isPending}
        onConfirm={() => { if (toDelete) deleteMut.mutate(toDelete.id); }}
      />
    </div>
  );
}