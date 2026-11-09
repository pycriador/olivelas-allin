import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Edit3, Star, Layout } from "lucide-react";
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
import { dashboardService } from "@/modules/reporting/service";
import type { Dashboard } from "@/modules/reporting/types";
import { Grid3X3 } from "lucide-react";

export const Route = createFileRoute("/_app/reporting/dashboards")({
  head: () => ({ meta: [{ title: "Dashboards — ServiceForge" }] }),
  component: DashboardsPage,
});

const categoryOptions = [
  { value: "executive", label: "Executivo" },
  { value: "technical", label: "Técnico" },
  { value: "financial", label: "Financeiro" },
  { value: "administrative", label: "Administrativo" },
  { value: "operational", label: "Operacional" },
  { value: "ai", label: "IA" },
  { value: "integrations", label: "Integrações" },
  { value: "audit", label: "Auditoria" },
  { value: "custom", label: "Personalizado" },
];

function DashboardsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("executive");

  const { data: dashboards = [] } = useQuery({
    queryKey: ["reporting", "dashboards"],
    queryFn: () => dashboardService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => dashboardService.create({
      name: formName,
      description: formDescription,
      icon: "layout-dashboard",
      category: formCategory as Dashboard["category"],
      companyId: undefined,
      isGlobal: true,
      isDefault: false,
      tabs: [],
      globalFilters: [],
      layout: "grid",
      widgets: [],
      favorite: false,
      version: 1,
      tags: [],
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "dashboards"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Dashboard criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar dashboard"),
  });

  const updateMut = useMutation({
    mutationFn: () => dashboardService.update(editingId!, {
      name: formName,
      description: formDescription,
      category: formCategory as Dashboard["category"],
      updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "dashboards"] });
      setDialogOpen(false);
      setEditingId(null);
      resetForm();
      toast.success("Dashboard atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar dashboard"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => dashboardService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "dashboards"] });
      toast.success("Dashboard excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir dashboard"),
  });

  const toggleFavoriteMut = useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      dashboardService.update(id, { favorite, updatedAt: new Date().toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "dashboards"] });
    },
    onError: () => toast.error("Erro ao alterar favorito"),
  });

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormCategory("executive");
  };

  const openEdit = (id: string) => {
    const d = dashboards.find(ds => ds.id === id);
    if (!d) return;
    setEditingId(id);
    setFormName(d.name);
    setFormDescription(d.description);
    setFormCategory(d.category);
    setDialogOpen(true);
  };

  const categoryLabel = (cat: string) => categoryOptions.find(o => o.value === cat)?.label ?? cat;

  const filtered = dashboards.filter(d => {
    if (filterCategory !== "all" && d.category !== filterCategory) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboards</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus dashboards</p>
        </div>
        <Button onClick={() => { setEditingId(null); resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Novo Dashboard
        </Button>
      </div>

      <div className="flex gap-4">
        <Input placeholder="Pesquisar dashboards..." className="max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categoryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(d => (
          <Card key={d.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-sm font-medium">{d.name}</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggleFavoriteMut.mutate({ id: d.id, favorite: !d.favorite })}>
                  <Star className={`h-4 w-4 ${d.favorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground line-clamp-2">{d.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">{categoryLabel(d.category)}</Badge>
                <span className="flex items-center gap-1"><Grid3X3 className="h-3 w-3" />{d.widgets.length} widgets</span>
                <span>v{d.version}</span>
              </div>
              <div className="flex justify-end gap-1 pt-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(d.id)}><Edit3 className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">Nenhum dashboard encontrado</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editingId ? "Editar Dashboard" : "Novo Dashboard"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nome do dashboard" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descrição</Label>
                <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Descrição opcional" />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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
        onOpenChange={o => { if (!o) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
        title="Excluir Dashboard"
        description="Tem certeza que deseja excluir este dashboard? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
