import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Play, Download, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { reportService } from "@/modules/reporting/service";
import type { Report, ReportType, ReportCategory } from "@/modules/reporting/types";

export const Route = createFileRoute("/_app/reporting/reports")({
  head: () => ({ meta: [{ title: "Relatórios — ServiceForge" }] }),
  component: ReportsPage,
});

const typeOptions = [
  { value: "tabular", label: "Tabular" },
  { value: "summary", label: "Resumo" },
  { value: "detail", label: "Detalhado" },
  { value: "label", label: "Etiqueta" },
  { value: "form", label: "Formulário" },
  { value: "document", label: "Documento" },
  { value: "dashboard", label: "Dashboard" },
  { value: "analytics", label: "Analítico" },
];

const categoryOptions = [
  { value: "operational", label: "Operacional" },
  { value: "managerial", label: "Gerencial" },
  { value: "strategic", label: "Estratégico" },
  { value: "financial", label: "Financeiro" },
  { value: "technical", label: "Técnico" },
  { value: "administrative", label: "Administrativo" },
  { value: "custom", label: "Personalizado" },
  { value: "serviceOrder", label: "Ordem de Serviço" },
  { value: "receipt", label: "Recibo" },
  { value: "warranty", label: "Garantia" },
  { value: "budget", label: "Orçamento" },
  { value: "certificate", label: "Certificado" },
  { value: "declaration", label: "Declaração" },
  { value: "protocol", label: "Protocolo" },
  { value: "checklist", label: "Checklist" },
];

function ReportsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<ReportType>("tabular");
  const [formCategory, setFormCategory] = useState<ReportCategory>("operational");
  const [formOrientation, setFormOrientation] = useState<"portrait" | "landscape">("portrait");
  const [formPageSize, setFormPageSize] = useState<"A4" | "A5" | "letter" | "label" | "thermal">("A4");

  const { data: reports = [] } = useQuery({
    queryKey: ["reporting", "reports"],
    queryFn: () => reportService.list(),
  });

  const executeMut = useMutation({
    mutationFn: async (id: string) => {
      const r = reports.find(rep => rep.id === id);
      if (!r) throw new Error("Relatório não encontrado");
      await new Promise(r => setTimeout(r, 1500));
      return r.name;
    },
    onSuccess: (name) => {
      setExecutingId(null);
      toast.success(`Relatório "${name}" executado com sucesso em ${(1.5).toFixed(1)}s`);
    },
    onError: () => {
      setExecutingId(null);
      toast.error("Erro ao executar relatório");
    },
  });

  const createMut = useMutation({
    mutationFn: () => reportService.create({
      name: formName,
      description: formDescription,
      type: formType,
      category: formCategory,
      config: {
        orientation: formOrientation,
        pageSize: formPageSize,
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
        scale: 100,
        showPageNumbers: true,
        showDateTime: true,
        showLogo: true,
        sections: [],
      },
      parameters: [],
      schedules: [],
      isGlobal: true,
      status: "draft" as const,
      version: 1,
      tags: [],
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "reports"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Relatório criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar relatório"),
  });

  const updateMut = useMutation({
    mutationFn: () => reportService.update(editingId!, {
      name: formName,
      description: formDescription,
      type: formType,
      category: formCategory,
      config: { orientation: formOrientation, pageSize: formPageSize, margins: { top: 20, bottom: 20, left: 20, right: 20 }, scale: 100, showPageNumbers: true, showDateTime: true, showLogo: true, sections: [] },
      updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "reports"] });
      setDialogOpen(false);
      setEditingId(null);
      resetForm();
      toast.success("Relatório atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar relatório"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => reportService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "reports"] });
      toast.success("Relatório excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir relatório"),
  });

  const exportMut = useMutation({
    mutationFn: async (id: string) => {
      const r = reports.find(rep => rep.id === id);
      if (!r) throw new Error("Relatório não encontrado");
      await new Promise(r => setTimeout(r, 1000));
      return r.name;
    },
    onSuccess: (name) => {
      toast.success(`Relatório "${name}" exportado como PDF`);
    },
    onError: () => toast.error("Erro ao exportar relatório"),
  });

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormType("tabular");
    setFormCategory("operational");
    setFormOrientation("portrait");
    setFormPageSize("A4");
  };

  const openEdit = (id: string) => {
    const r = reports.find(rep => rep.id === id);
    if (!r) return;
    setEditingId(id);
    setFormName(r.name);
    setFormDescription(r.description);
    setFormType(r.type);
    setFormCategory(r.category);
    setFormOrientation(r.config?.orientation ?? "portrait");
    setFormPageSize(r.config?.pageSize ?? "A4");
    setDialogOpen(true);
  };

  const typeLabel = (type: string) => typeOptions.find(o => o.value === type)?.label ?? type;
  const categoryLabel = (cat: string) => categoryOptions.find(o => o.value === cat)?.label ?? cat;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Gerencie os relatórios do sistema</p>
        </div>
        <Button onClick={() => { setEditingId(null); resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Novo Relatório
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Última Execução</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map(r => (
              <TableRow key={r.id}>
                <TableCell>
                  <div>
                    <span className="font-medium">{r.name}</span>
                    {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary">{typeLabel(r.type)}</Badge></TableCell>
                <TableCell><Badge variant="outline">{categoryLabel(r.category)}</Badge></TableCell>
                <TableCell>
                  {r.status === "published" ? <Badge className="bg-green-100 text-green-800">Publicado</Badge> : <Badge variant="outline">Rascunho</Badge>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">v{r.version}</TableCell>
                <TableCell className="text-sm text-muted-foreground">—</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={executingId === r.id} onClick={() => { setExecutingId(r.id); executeMut.mutate(r.id); }}>
                      <Play className="h-3 w-3 mr-1" />{executingId === r.id ? "Executando..." : "Executar"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => exportMut.mutate(r.id)}><Download className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r.id)}><Edit3 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {reports.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum relatório encontrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editingId ? "Editar Relatório" : "Novo Relatório"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nome do relatório" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descrição</Label>
                <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Descrição opcional" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as ReportType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as ReportCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Orientação</Label>
                <Select value={formOrientation} onValueChange={(v) => setFormOrientation(v as "portrait" | "landscape")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Retrato</SelectItem>
                    <SelectItem value="landscape">Paisagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tamanho de Página</Label>
                <Select value={formPageSize} onValueChange={(v) => setFormPageSize(v as "A4" | "A5" | "letter" | "label" | "thermal")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                    <SelectItem value="letter">Carta</SelectItem>
                    <SelectItem value="thermal">Térmico</SelectItem>
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
        title="Excluir Relatório"
        description="Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
