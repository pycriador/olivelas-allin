import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Edit3, Star, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { workflowService } from "@/modules/automation/service";
import type { Workflow, WorkflowStatus } from "@/modules/automation/types";
import { AUTOMATION_CONSTANTS } from "@/modules/automation/types";

export const Route = createFileRoute("/_app/automation/workflows")({
  head: () => ({ meta: [{ title: "Biblioteca de Workflows — ServiceForge" }] }),
  component: WorkflowsPage,
});

const categoryOptions = AUTOMATION_CONSTANTS.WORKFLOW_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1).replace(/([A-Z])/g, " $1"),
}));

const statusConfig: Record<WorkflowStatus, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
  draft: { label: "Rascunho", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100" },
  paused: { label: "Pausado", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100" },
  archived: { label: "Arquivado", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
};

function WorkflowsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("serviceOrder");
  const [formStatus, setFormStatus] = useState<WorkflowStatus>("draft");

  const { data: workflows = [] } = useQuery({
    queryKey: ["automation", "workflows"],
    queryFn: () => workflowService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => workflowService.create({
      name: formName,
      description: formDescription,
      category: formCategory,
      icon: "workflow",
      status: formStatus,
      version: 1,
      steps: [],
      actions: [],
      trigger: { type: "manual" },
      variables: [],
      tags: [],
      isGlobal: true,
      isTemplate: false,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      avgDuration: 0,
      favorite: false,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation", "workflows"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Workflow criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar workflow"),
  });

  const updateMut = useMutation({
    mutationFn: () => workflowService.update(editingId!, {
      name: formName,
      description: formDescription,
      category: formCategory,
      status: formStatus,
      updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation", "workflows"] });
      setDialogOpen(false);
      setEditingId(null);
      resetForm();
      toast.success("Workflow atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar workflow"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => workflowService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation", "workflows"] });
      toast.success("Workflow excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir workflow"),
  });

  const toggleFavoriteMut = useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      workflowService.update(id, { favorite, updatedAt: new Date().toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automation", "workflows"] });
    },
    onError: () => toast.error("Erro ao alterar favorito"),
  });

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormCategory("serviceOrder");
    setFormStatus("draft");
  };

  const openEdit = (id: string) => {
    const w = workflows.find((wf) => wf.id === id);
    if (!w) return;
    setEditingId(id);
    setFormName(w.name);
    setFormDescription(w.description);
    setFormCategory(w.category);
    setFormStatus(w.status);
    setDialogOpen(true);
  };

  const filtered = workflows.filter((w) => {
    if (filterCategory !== "all" && w.category !== filterCategory) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Biblioteca de Workflows</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus workflows de automação</p>
        </div>
        <Button onClick={() => { setEditingId(null); resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Novo Workflow
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar workflows..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categoryOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((w) => (
          <Card key={w.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">{w.name}</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggleFavoriteMut.mutate({ id: w.id, favorite: !w.favorite })}>
                  <Star className={`h-4 w-4 ${w.favorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground line-clamp-2">{w.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <Badge variant="outline" className="text-xs">{categoryOptions.find((o) => o.value === w.category)?.label ?? w.category}</Badge>
                <Badge className={`text-xs ${statusConfig[w.status].className}`}>{statusConfig[w.status].label}</Badge>
                <span>v{w.version}</span>
                <span>{w.executionCount} execuções</span>
              </div>
              {w.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {w.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-1 pt-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(w.id)}><Edit3 className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(w.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">Nenhum workflow encontrado</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editingId ? "Editar Workflow" : "Novo Workflow"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome do workflow" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descrição</Label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição opcional" />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as WorkflowStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => (editingId ? updateMut.mutate() : createMut.mutate())} disabled={!formName}>
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
        title="Excluir Workflow"
        description="Tem certeza que deseja excluir este workflow? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
