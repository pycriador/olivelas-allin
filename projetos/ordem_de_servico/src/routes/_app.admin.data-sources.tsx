import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Database, CheckCircle2, XCircle, AlertCircle, Wifi, WifiOff, TestTube } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { DocButton } from "@/components/doc-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { dataSourceService } from "@/modules/admin/service";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { DataSource } from "@/modules/admin/types";

const dataSourceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  type: z.string().min(1, "Tipo é obrigatório"),
  status: z.enum(["active", "inactive", "error"]),
});

type DataSourceForm = z.infer<typeof dataSourceSchema>;

export const Route = createFileRoute("/_app/admin/data-sources")({
  head: () => ({ meta: [{ title: "Admin Fontes de Dados — ServiceForge" }] }),
  component: AdminDataSourcesPage,
});

function AdminDataSourcesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [configEntries, setConfigEntries] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);

  const { data: datasources = [] } = useQuery({ queryKey: ["admin", "datasources", "list"], queryFn: () => dataSourceService.list() });

  const form = useForm<DataSourceForm>({
    resolver: zodResolver(dataSourceSchema),
    defaultValues: { status: "active" },
  });

  const createMut = useMutation({
    mutationFn: (data: DataSourceForm) => dataSourceService.create({
      name: data.name, description: data.description ?? "", type: data.type,
      status: data.status, config: configEntries.filter(e => e.key).reduce((acc, e) => ({ ...acc, [e.key]: e.value }), {}),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "datasources"] }); setDialogOpen(false); form.reset(); setConfigEntries([{ key: "", value: "" }]); toast.success("Fonte de dados criada"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DataSourceForm }) => {
      const existing = datasources.find(d => d.id === id);
      return dataSourceService.update(id, {
        ...data, updatedAt: new Date().toISOString(),
        config: configEntries.filter(e => e.key).reduce((acc, e) => ({ ...acc, [e.key]: e.value }), {}),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "datasources"] }); setDialogOpen(false); setEditingId(null); form.reset(); setConfigEntries([{ key: "", value: "" }]); toast.success("Fonte de dados atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => dataSourceService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "datasources"] }); toast.success("Fonte de dados excluída"); },
  });

  const testMut = useMutation({
    mutationFn: (id: string) => dataSourceService.test(id),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["admin", "datasources"] }); if (res.success) { toast.success(res.message); } else { toast.error(res.message); } },
    onError: () => { toast.error("Erro ao testar conexão"); },
  });

  const openEdit = (id: string) => {
    const d = datasources.find(d => d.id === id);
    if (!d) return;
    setEditingId(id);
    form.reset({ name: d.name, description: d.description, type: d.type, status: d.status });
    const entries = Object.entries(d.config).map(([k, v]) => ({ key: k, value: v }));
    setConfigEntries(entries.length > 0 ? entries : [{ key: "", value: "" }]);
    setDialogOpen(true);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive"; icon: React.ReactNode; label: string }> = {
      active: { variant: "default", icon: <Wifi className="h-3 w-3" />, label: "Ativo" },
      inactive: { variant: "secondary", icon: <WifiOff className="h-3 w-3" />, label: "Inativo" },
      error: { variant: "destructive", icon: <AlertCircle className="h-3 w-3" />, label: "Erro" },
    };
    const m = map[status] ?? map.inactive;
    return <Badge variant={m.variant} className="gap-1">{m.icon}{m.label}</Badge>;
  };

  const columns: Column<DataSource>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (d) => (
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{d.name}</span>
      </div>
    )},
    { key: "type", header: "Tipo", render: (d) => <Badge variant="outline">{d.type}</Badge> },
    { key: "status", header: "Status", render: (d) => statusBadge(d.status) },
    { key: "lastSync", header: "Última Sincronização", render: (d) => <span className="text-sm">{d.lastSync ? new Date(d.lastSync).toLocaleString() : "—"}</span> },
    { key: "testResult", header: "Resultado Teste", render: (d) => d.testResult === "success" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : d.testResult === "failed" ? <XCircle className="h-4 w-4 text-destructive" /> : <span className="text-sm text-muted-foreground">—</span> },
    { key: "actions", header: "Ações", render: (d) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => testMut.mutate(d.id)} title="Testar Conexão"><TestTube className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => openEdit(d.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.dataSources")}</h1>
            <DocButton module="admin" page="data-sources" title="Fontes de Dados" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie as fontes de dados da plataforma</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ status: "active" }); setConfigEntries([{ key: "", value: "" }]); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Nova Fonte de Dados
        </Button>
      </div>

      <DataTable
        data={datasources}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchKeys={["name", "type", "description"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Fonte de Dados" : "Nova Fonte de Dados"}</DialogTitle>
            <DialogDescription>Configure a fonte de dados</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
              <div className="space-y-2 col-span-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
              <div className="space-y-2"><Label>Tipo</Label><Input {...form.register("type")} placeholder="Ex: PostgreSQL, MySQL, API" /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as "active" | "inactive" | "error")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Configuração (chave/valor)</Label>
              {configEntries.map((entry, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder="Chave"
                    value={entry.key}
                    onChange={(e) => {
                      const next = [...configEntries];
                      next[idx] = { ...next[idx], key: e.target.value };
                      setConfigEntries(next);
                    }}
                  />
                  <Input
                    placeholder="Valor"
                    value={entry.value}
                    onChange={(e) => {
                      const next = [...configEntries];
                      next[idx] = { ...next[idx], value: e.target.value };
                      setConfigEntries(next);
                    }}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfigEntries(configEntries.filter((_, i) => i !== idx))}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setConfigEntries([...configEntries, { key: "", value: "" }])}>
                + Adicionar
              </Button>
            </div>

            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit">{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
}