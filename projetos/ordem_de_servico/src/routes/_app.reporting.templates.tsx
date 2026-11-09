import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Edit3, Copy, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { templateService } from "@/modules/reporting/service";
import type { ReportTemplate, ReportType, ReportCategory } from "@/modules/reporting/types";

export const Route = createFileRoute("/_app/reporting/templates")({
  head: () => ({ meta: [{ title: "Reporting Templates — ServiceForge" }] }),
  component: ReportingTemplatesPage,
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

function ReportingTemplatesPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("tabular");
  const [formCategory, setFormCategory] = useState("operational");

  const { data: templates = [] } = useQuery({
    queryKey: ["reporting", "templates"],
    queryFn: () => templateService.list(),
  });

  const defaultConfig = {
    orientation: "portrait" as const,
    pageSize: "A4" as const,
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    scale: 100,
    showPageNumbers: true,
    showDateTime: true,
    showLogo: true,
    sections: [],
  };

  const createMut = useMutation({
    mutationFn: () =>
      templateService.create({
        name: formName,
        description: formDescription,
        type: formType as ReportType,
        category: formCategory as ReportCategory,
        isGlobal: true,
        isPublished: false,
        isArchived: false,
        version: 1,
        config: defaultConfig as any,
        parameters: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "templates"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Template criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar template"),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      templateService.update(editingId!, {
        name: formName,
        description: formDescription,
        type: formType as ReportType,
        category: formCategory as ReportCategory,
        updatedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "templates"] });
      setDialogOpen(false);
      setEditingId(null);
      resetForm();
      toast.success("Template atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar template"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => templateService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "templates"] });
      toast.success("Template excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir template"),
  });

  const publishMut = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      templateService.update(id, { isPublished, updatedAt: new Date().toISOString() }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["reporting", "templates"] });
      toast.success(vars.isPublished ? "Template publicado com sucesso" : "Template despublicado com sucesso");
    },
    onError: () => toast.error("Erro ao alterar status de publicação"),
  });

  const duplicateMut = useMutation({
    mutationFn: (id: string) => {
      const t = templates.find((tmpl) => tmpl.id === id);
      if (!t) throw new Error("Template não encontrado");
      const { id: _id, ...rest } = t;
      return templateService.create({
        ...rest,
        name: `Cópia de ${t.name}`,
        version: 1,
        isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "templates"] });
      toast.success("Template duplicado com sucesso");
    },
    onError: () => toast.error("Erro ao duplicar template"),
  });

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormType("tabular");
    setFormCategory("operational");
  };

  const openEdit = (id: string) => {
    const t = templates.find((tmpl) => tmpl.id === id);
    if (!t) return;
    setEditingId(id);
    setFormName(t.name);
    setFormDescription(t.description);
    setFormType(t.type);
    setFormCategory(t.category);
    setDialogOpen(true);
  };

  const filtered = templates.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    return true;
  });

  const typeLabel = (type: string) => typeOptions.find((o) => o.value === type)?.label ?? type;
  const categoryLabel = (cat: string) => categoryOptions.find((o) => o.value === cat)?.label ?? cat;

  const columns: Column<ReportTemplate>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
      render: (t) => <span className="font-medium">{t.name}</span>,
    },
    {
      key: "type",
      header: "Tipo",
      render: (t) => <Badge variant="secondary">{typeLabel(t.type)}</Badge>,
    },
    {
      key: "category",
      header: "Categoria",
      render: (t) => <Badge variant="outline">{categoryLabel(t.category)}</Badge>,
    },
    {
      key: "isGlobal",
      header: "Global",
      render: (t) =>
        t.isGlobal ? (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            Sim
          </Badge>
        ) : (
          <Badge variant="outline">Não</Badge>
        ),
    },
    {
      key: "isPublished",
      header: "Publicado",
      render: (t) =>
        t.isPublished ? (
          <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Sim
          </Badge>
        ) : (
          <Badge variant="outline">Não</Badge>
        ),
    },
    {
      key: "isArchived",
      header: "Arquivado",
      render: (t) =>
        t.isArchived ? (
          <Badge variant="destructive">Sim</Badge>
        ) : (
          <Badge variant="outline">Não</Badge>
        ),
    },
    { key: "version", header: "Versão", render: (t) => <span className="text-sm text-muted-foreground">v{t.version}</span> },
    {
      key: "actions",
      header: "Ações",
      render: (t) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => publishMut.mutate({ id: t.id, isPublished: !t.isPublished })}
            title={t.isPublished ? "Despublicar" : "Publicar"}
          >
            {t.isPublished ? <XCircle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => duplicateMut.mutate(t.id)} title="Duplicar">
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(t.id)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteId(t.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">Gerencie os templates de relatórios</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />Novo Template
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {typeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Categoria:</span>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categoryOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchKeys={["name", "description"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome do template" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descrição</Label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição opcional" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => (editingId ? updateMut.mutate() : createMut.mutate())}
                disabled={!formName}
              >
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId) {
            deleteMut.mutate(deleteId);
            setDeleteId(null);
          }
        }}
        title="Excluir Template"
        description="Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}