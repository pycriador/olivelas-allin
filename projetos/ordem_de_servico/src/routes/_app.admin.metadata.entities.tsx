import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, CheckCircle2, XCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { metadataEntityService, metadataFieldService } from "@/modules/metadata/service";
import type { MetadataEntity } from "@/modules/metadata/types";
import { DocButton } from "@/components/doc-button";
import { ENTITY_CATEGORIES } from "@/modules/metadata/types";

const entitySchema = z.object({
  name: z.string().min(1),
  pluralName: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  auditable: z.boolean().optional(),
  hasFiles: z.boolean().optional(),
  hasTimeline: z.boolean().optional(),
  hasComments: z.boolean().optional(),
  hasVersioning: z.boolean().optional(),
  level: z.enum(["global", "company", "user"]),
});

type EntityForm = z.infer<typeof entitySchema>;

export const Route = createFileRoute("/_app/admin/metadata/entities")({
  head: () => ({ meta: [{ title: "Entity Manager — ServiceForge" }] }),
  component: EntityManagerPage,
});

function EntityManagerPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<MetadataEntity | null>(null);

  const { data: entities = [] } = useQuery({ queryKey: ["metadata", "entities"], queryFn: () => metadataEntityService.list() });
  const { data: fields = [] } = useQuery({ queryKey: ["metadata", "fields"], queryFn: () => metadataFieldService.list(selectedEntity?.id) });

  const form = useForm<EntityForm>({
    resolver: zodResolver(entitySchema),
    defaultValues: { status: "active", level: "global" },
  });

  const createMut = useMutation({
    mutationFn: (data: EntityForm) => metadataEntityService.create({
      name: data.name, pluralName: data.pluralName, description: data.description ?? "",
      icon: data.icon ?? "Database", category: data.category ?? "platform",
      status: data.status, auditable: data.auditable ?? true, hasFiles: data.hasFiles ?? false,
      hasTimeline: data.hasTimeline ?? true, hasComments: data.hasComments ?? false,
      hasVersioning: data.hasVersioning ?? false, companyId: null, version: 1,
      level: data.level, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata"] }); setDialogOpen(false); form.reset(); toast.success("Entidade criada"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EntityForm }) => metadataEntityService.update(id, { ...data, updatedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Entidade atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => metadataEntityService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata"] }); toast.success("Entidade excluída"); },
  });

  const openEdit = (e: MetadataEntity) => {
    setEditingId(e.id);
    form.reset({ name: e.name, pluralName: e.pluralName, description: e.description, icon: e.icon, category: e.category, status: e.status, auditable: e.auditable, hasFiles: e.hasFiles, hasTimeline: e.hasTimeline, hasComments: e.hasComments, hasVersioning: e.hasVersioning, level: e.level });
    setDialogOpen(true);
  };

  const columns: Column<MetadataEntity>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (e) => (
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedEntity(selectedEntity?.id === e.id ? null : e)}>
        <Database className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{e.name}</div>
          <div className="text-xs text-muted-foreground">{e.pluralName}</div>
        </div>
      </div>
    )},
    { key: "category", header: "Categoria", sortable: true, sortFn: (a, b) => a.category.localeCompare(b.category), render: (e) => <Badge variant="outline">{e.category}</Badge> },
    { key: "level", header: "Nível", render: (e) => <Badge variant="secondary" className="capitalize">{e.level}</Badge> },
    { key: "status", header: "Status", render: (e) => (
      <Badge variant={e.status === "active" ? "default" : "secondary"} className="gap-1">
        {e.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {e.status === "active" ? "Ativo" : "Inativo"}
      </Badge>
    )},
    { key: "version", header: "Versão", render: (e) => <span className="text-sm">v{e.version}</span> },
    { key: "createdAt", header: "Criado em", sortable: true, sortFn: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(), render: (e) => <span className="text-sm text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</span> },
    { key: "actions", header: "Ações", render: (e) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(e)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Entity Manager</h1>
            <DocButton module="admin" page="entities" title="Entity Manager" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie as entidades do sistema</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ status: "active", level: "global" }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Nova Entidade
        </Button>
      </div>

      <DataTable
        data={entities}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchKeys={["name", "pluralName", "description", "category"]}
        initialSortColumn="name"
      />

      {selectedEntity && (
        <div className="rounded-md border p-4">
          <h3 className="text-sm font-medium mb-2">Campos de <strong>{selectedEntity.name}</strong> ({fields.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {fields.slice(0, 12).map((f) => (
              <div key={f.id} className="flex items-center gap-2 text-sm border rounded p-2">
                <span className="font-medium">{f.label}</span>
                <Badge variant="outline" className="text-[10px]">{f.type}</Badge>
              </div>
            ))}
            {fields.length > 12 && <span className="text-sm text-muted-foreground p-2">+{fields.length - 12} campos</span>}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Entidade" : "Nova Entidade"}</DialogTitle><DialogDescription>Preencha os dados da entidade</DialogDescription></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome (singular)</Label><Input {...form.register("name")} /></div>
              <div className="space-y-2"><Label>Nome (plural)</Label><Input {...form.register("pluralName")} /></div>
              <div className="space-y-2"><Label>Categoria</Label>
                <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTITY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nível</Label>
                <Select value={form.watch("level")} onValueChange={(v) => form.setValue("level", v as "global" | "company" | "user")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="company">Empresa</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Ícone</Label><Input {...form.register("icon")} placeholder="Database" /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as "active" | "inactive")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Switch defaultChecked={form.watch("auditable")} onCheckedChange={(v) => form.setValue("auditable", v)} /><Label>Auditável</Label></div>
              <div className="flex items-center gap-2"><Switch defaultChecked={form.watch("hasTimeline")} onCheckedChange={(v) => form.setValue("hasTimeline", v)} /><Label>Timeline</Label></div>
              <div className="flex items-center gap-2"><Switch defaultChecked={form.watch("hasFiles")} onCheckedChange={(v) => form.setValue("hasFiles", v)} /><Label>Arquivos</Label></div>
              <div className="flex items-center gap-2"><Switch defaultChecked={form.watch("hasComments")} onCheckedChange={(v) => form.setValue("hasComments", v)} /><Label>Comentários</Label></div>
              <div className="flex items-center gap-2"><Switch defaultChecked={form.watch("hasVersioning")} onCheckedChange={(v) => form.setValue("hasVersioning", v)} /><Label>Versionamento</Label></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }} />
    </div>
  );
}
