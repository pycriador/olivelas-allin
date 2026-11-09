import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Edit3, Database } from "lucide-react";
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
import { datasetService } from "@/modules/reporting/service";
import type { Dataset } from "@/modules/reporting/types";

export const Route = createFileRoute("/_app/reporting/datasets")({
  head: () => ({ meta: [{ title: "Reporting Datasets — ServiceForge" }] }),
  component: ReportingDatasetsPage,
});

const sourceOptions = [
  { value: "metadata", label: "Metadados" },
  { value: "query", label: "Consulta" },
  { value: "sql", label: "SQL" },
  { value: "integration", label: "Integração" },
  { value: "file", label: "Arquivo" },
];

function ReportingDatasetsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string>("all");

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSource, setFormSource] = useState("metadata");
  const [formEntityId, setFormEntityId] = useState("");
  const [formEntityName, setFormEntityName] = useState("");

  const { data: datasets = [] } = useQuery({
    queryKey: ["reporting", "datasets"],
    queryFn: () => datasetService.list(),
  });

  const createMut = useMutation({
    mutationFn: () =>
      datasetService.create({
        name: formName,
        description: formDescription,
        source: formSource as Dataset["source"],
        entityId: formEntityId || undefined,
        entityName: formEntityName || undefined,
        joins: [],
        filters: [],
        groups: [],
        sorts: [],
        calculatedFields: [],
        companyId: undefined,
        isGlobal: true,
        isPublished: false,
        version: 1,
        fields: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "system",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "datasets"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Dataset criado com sucesso");
    },
    onError: () => toast.error("Erro ao criar dataset"),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      datasetService.update(editingId!, {
        name: formName,
        description: formDescription,
        source: formSource as Dataset["source"],
        entityId: formEntityId || undefined,
        entityName: formEntityName || undefined,
        updatedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "datasets"] });
      setDialogOpen(false);
      setEditingId(null);
      resetForm();
      toast.success("Dataset atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar dataset"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => datasetService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reporting", "datasets"] });
      toast.success("Dataset excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir dataset"),
  });

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormSource("metadata");
    setFormEntityId("");
    setFormEntityName("");
  };

  const openEdit = (id: string) => {
    const d = datasets.find((ds) => ds.id === id);
    if (!d) return;
    setEditingId(id);
    setFormName(d.name);
    setFormDescription(d.description);
    setFormSource(d.source);
    setFormEntityId(d.entityId ?? "");
    setFormEntityName(d.entityName ?? "");
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setDialogOpen(true);
  };

  const filtered = filterSource === "all" ? datasets : datasets.filter((d) => d.source === filterSource);

  const columns: Column<Dataset>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
      render: (d) => (
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{d.name}</span>
        </div>
      ),
    },
    {
      key: "source",
      header: "Fonte",
      render: (d) => {
        const s = sourceOptions.find((o) => o.value === d.source);
        return <Badge variant="secondary">{s?.label ?? d.source}</Badge>;
      },
    },
    { key: "entity", header: "Entidade", render: (d) => <span>{d.entityName ?? "—"}</span> },
    {
      key: "isGlobal",
      header: "Global",
      render: (d) =>
        d.isGlobal ? (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            Sim
          </Badge>
        ) : (
          <Badge variant="outline">Não</Badge>
        ),
    },
    { key: "version", header: "Versão", render: (d) => <span className="text-sm text-muted-foreground">v{d.version}</span> },
    {
      key: "createdBy",
      header: "Criado Por",
      render: (d) => <span className="text-sm text-muted-foreground">{d.createdBy}</span>,
    },
    {
      key: "actions",
      header: "Ações",
      render: (d) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(d.id)}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteId(d.id)}>
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
          <h1 className="text-2xl font-semibold tracking-tight">Datasets</h1>
          <p className="text-sm text-muted-foreground">Gerencie os datasets de relatórios</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />Novo Dataset
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrar por fonte:</span>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {sourceOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchKeys={["name", "description", "entityName"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Dataset" : "Novo Dataset"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome do dataset" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descrição opcional"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Fonte</Label>
                <Select value={formSource} onValueChange={setFormSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID da Entidade</Label>
                <Input value={formEntityId} onChange={(e) => setFormEntityId(e.target.value)} placeholder="ID da entidade" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Nome da Entidade</Label>
                <Input value={formEntityName} onChange={(e) => setFormEntityName(e.target.value)} placeholder="Nome da entidade" />
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
        title="Excluir Dataset"
        description="Tem certeza que deseja excluir este dataset? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}