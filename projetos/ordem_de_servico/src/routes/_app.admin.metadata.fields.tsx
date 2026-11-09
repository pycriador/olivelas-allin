import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, GripVertical, CheckCircle2, XCircle } from "lucide-react";
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
import type { MetadataField, FieldType } from "@/modules/metadata/types";
import { DocButton } from "@/components/doc-button";
import { FIELD_TYPE_LABELS, FIELD_TYPE_CATEGORIES } from "@/modules/metadata/types";

const fieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.string().min(1),
  entityId: z.string().min(1),
  required: z.boolean().optional(),
  visible: z.boolean().optional(),
  editable: z.boolean().optional(),
  searchable: z.boolean().optional(),
  unique: z.boolean().optional(),
  defaultValue: z.string().optional(),
  placeholder: z.string().optional(),
  tooltip: z.string().optional(),
  mask: z.string().optional(),
  regex: z.string().optional(),
  validation: z.string().optional(),
  group: z.string().optional(),
  order: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  level: z.enum(["global", "company", "user"]),
  status: z.enum(["active", "inactive"]),
});

type FieldForm = z.infer<typeof fieldSchema>;

export const Route = createFileRoute("/_app/admin/metadata/fields")({
  head: () => ({ meta: [{ title: "Field Manager — ServiceForge" }] }),
  component: FieldManagerPage,
});

function FieldManagerPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>("");

  const { data: entities = [] } = useQuery({ queryKey: ["metadata", "entities"], queryFn: () => metadataEntityService.list() });
  const { data: allFields = [] } = useQuery({ queryKey: ["metadata", "fields"], queryFn: () => metadataFieldService.list() });
  const fields = entityFilter ? allFields.filter((f) => f.entityId === entityFilter) : allFields;

  const form = useForm<FieldForm>({
    resolver: zodResolver(fieldSchema),
    defaultValues: { type: "text", level: "global", status: "active", width: 12, order: 1, visible: true, editable: true },
  });

  const createMut = useMutation({
    mutationFn: (data: FieldForm) => metadataFieldService.create({
      name: data.name, label: data.label, type: data.type as FieldType, entityId: data.entityId,
      required: data.required ?? false, visible: data.visible ?? true, editable: data.editable ?? true,
      searchable: data.searchable ?? false, unique: data.unique ?? false, defaultValue: data.defaultValue ?? "",
      placeholder: data.placeholder ?? "", tooltip: data.tooltip ?? "", mask: data.mask ?? "",
      regex: data.regex ?? "", validation: data.validation ?? "", group: data.group ?? "Geral",
      order: data.order ?? 1, width: data.width ?? 12, companyId: null, version: 1,
      level: data.level, status: data.status, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "fields"] }); setDialogOpen(false); form.reset(); toast.success("Campo criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FieldForm }) => metadataFieldService.update(id, { ...data, type: data.type as FieldType, updatedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "fields"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Campo atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => metadataFieldService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["metadata", "fields"] }); toast.success("Campo excluído"); },
  });

  const openEdit = (f: MetadataField) => {
    setEditingId(f.id);
    form.reset({
      name: f.name, label: f.label, type: f.type, entityId: f.entityId,
      required: f.required, visible: f.visible, editable: f.editable, searchable: f.searchable,
      unique: f.unique, defaultValue: f.defaultValue, placeholder: f.placeholder, tooltip: f.tooltip,
      mask: f.mask, regex: f.regex, validation: f.validation, group: f.group, order: f.order,
      width: f.width, level: f.level, status: f.status,
    });
    setDialogOpen(true);
  };

  const getEntityName = (id: string) => entities.find((e) => e.id === id)?.name ?? id;

  const columns: Column<MetadataField>[] = [
    { key: "label", header: "Label", sortable: true, sortFn: (a, b) => a.label.localeCompare(b.label), render: (f) => (
      <div className="flex items-center gap-2"><GripVertical className="h-4 w-4 text-muted-foreground" /><div><div className="font-medium">{f.label}</div><div className="text-xs text-muted-foreground">{f.name}</div></div></div>
    )},
    { key: "entity", header: "Entidade", render: (f) => <span className="text-sm">{getEntityName(f.entityId)}</span> },
    { key: "type", header: "Tipo", render: (f) => <Badge variant="outline">{FIELD_TYPE_LABELS[f.type]}</Badge> },
    { key: "group", header: "Grupo", render: (f) => <span className="text-sm text-muted-foreground">{f.group}</span> },
    { key: "required", header: "Req", render: (f) => f.required ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" /> },
    { key: "status", header: "Status", render: (f) => (
      <Badge variant={f.status === "active" ? "default" : "secondary"} className="gap-1">
        {f.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      </Badge>
    )},
    { key: "order", header: "Ordem", render: (f) => <span className="text-sm">{f.order}</span> },
    { key: "actions", header: "Ações", render: (f) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Field Manager</h1>
            <DocButton module="admin" page="fields" title="Field Manager" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie os campos das entidades ({allFields.length} campos)</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ type: "text", level: "global", status: "active", width: 12, order: 1, visible: true, editable: true }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Novo Campo
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={entityFilter === "" ? "default" : "outline"} onClick={() => setEntityFilter("")}>Todos</Button>
        {entities.map((e) => (
          <Button key={e.id} size="sm" variant={entityFilter === e.id ? "default" : "outline"} onClick={() => setEntityFilter(e.id)}>
            {e.name} ({allFields.filter((f) => f.entityId === e.id).length})
          </Button>
        ))}
      </div>

      <DataTable data={fields} columns={columns} keyExtractor={(f) => f.id} searchKeys={["label", "name", "type", "group"]} initialSortColumn="order" />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Campo" : "Novo Campo"}</DialogTitle><DialogDescription>Preencha os dados do campo</DialogDescription></DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome (técnico)</Label><Input {...form.register("name")} placeholder="nome_campo" /></div>
              <div className="space-y-2"><Label>Label (exibição)</Label><Input {...form.register("label")} placeholder="Nome do Campo" /></div>
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_TYPE_CATEGORIES).map(([cat, types]) => (
                      <div key={cat}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">{cat}</div>
                        {types.map((t) => <SelectItem key={t} value={t}>{FIELD_TYPE_LABELS[t]}</SelectItem>)}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Entidade</Label>
                <Select value={form.watch("entityId")} onValueChange={(v) => form.setValue("entityId", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{entities.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Grupo</Label><Input {...form.register("group")} placeholder="Geral" /></div>
              <div className="space-y-2"><Label>Ordem</Label><Input type="number" {...form.register("order")} /></div>
              <div className="space-y-2"><Label>Largura (colunas 1-12)</Label><Input type="number" {...form.register("width")} /></div>
              <div className="space-y-2"><Label>Nível</Label>
                <Select value={form.watch("level")} onValueChange={(v) => form.setValue("level", v as "global" | "company" | "user")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="global">Global</SelectItem><SelectItem value="company">Empresa</SelectItem><SelectItem value="user">Usuário</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Valor Padrão</Label><Input {...form.register("defaultValue")} /></div>
              <div className="space-y-2"><Label>Placeholder</Label><Input {...form.register("placeholder")} /></div>
              <div className="space-y-2"><Label>Máscara</Label><Input {...form.register("mask")} placeholder="000.000.000-00" /></div>
              <div className="space-y-2"><Label>Regex</Label><Input {...form.register("regex")} /></div>
              <div className="space-y-2"><Label>Validação</Label><Input {...form.register("validation")} /></div>
              <div className="space-y-2"><Label>Tooltip</Label><Input {...form.register("tooltip")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Switch defaultChecked={form.watch("required")} onCheckedChange={(v) => form.setValue("required", v)} /><Label>Obrigatório</Label></div>
              <div className="flex items-center gap-2"><Switch defaultChecked={form.watch("visible")} onCheckedChange={(v) => form.setValue("visible", v)} /><Label>Visível</Label></div>
              <div className="flex items-center gap-2"><Switch defaultChecked={form.watch("editable")} onCheckedChange={(v) => form.setValue("editable", v)} /><Label>Editável</Label></div>
              <div className="flex items-center gap-2"><Switch defaultChecked={form.watch("searchable")} onCheckedChange={(v) => form.setValue("searchable", v)} /><Label>Pesquisável</Label></div>
              <div className="flex items-center gap-2"><Switch defaultChecked={form.watch("unique")} onCheckedChange={(v) => form.setValue("unique", v)} /><Label>Único</Label></div>
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
