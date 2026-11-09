import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Cable, Database, CheckCircle2, XCircle, AlertCircle, Wifi, WifiOff, TestTube } from "lucide-react";
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
import { providerService, dataSourceService } from "@/modules/admin/service";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { ProviderConfig, DataSource } from "@/modules/admin/types";

const providerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  provider: z.string().min(1, "Provedor é obrigatório"),
  status: z.enum(["active", "inactive", "error"]),
  priority: z.number().min(0).optional(),
  fallback: z.boolean().optional(),
});

type ProviderForm = z.infer<typeof providerSchema>;

const dataSourceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  type: z.string().min(1, "Tipo é obrigatório"),
  status: z.enum(["active", "inactive", "error"]),
});

type DataSourceForm = z.infer<typeof dataSourceSchema>;

export const Route = createFileRoute("/_app/admin/connectors")({
  head: () => ({ meta: [{ title: "Admin Conectores — ServiceForge" }] }),
  component: AdminConnectorsPage,
});

function AdminConnectorsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"providers" | "datasources">("providers");

  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [providerEditingId, setProviderEditingId] = useState<string | null>(null);
  const [providerDeleteId, setProviderDeleteId] = useState<string | null>(null);

  const [dsDialogOpen, setDsDialogOpen] = useState(false);
  const [dsEditingId, setDsEditingId] = useState<string | null>(null);
  const [dsDeleteId, setDsDeleteId] = useState<string | null>(null);

  const { data: providers = [] } = useQuery({ queryKey: ["admin", "providers", "list"], queryFn: () => providerService.list() });
  const { data: datasources = [] } = useQuery({ queryKey: ["admin", "datasources", "list"], queryFn: () => dataSourceService.list() });

  const connectors = providers.filter((p) => p.type === "connector");

  const providerForm = useForm<ProviderForm>({
    resolver: zodResolver(providerSchema),
    defaultValues: { status: "active", priority: 0, fallback: false },
  });

  const dsForm = useForm<DataSourceForm>({
    resolver: zodResolver(dataSourceSchema),
    defaultValues: { status: "active" },
  });

  const createProviderMut = useMutation({
    mutationFn: (data: ProviderForm) => providerService.create({
      name: data.name, type: "connector", provider: data.provider,
      status: data.status, priority: data.priority ?? 0, fallback: data.fallback ?? false,
      config: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "providers"] }); setProviderDialogOpen(false); providerForm.reset(); toast.success("Conector criado"); },
  });

  const updateProviderMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProviderForm }) => providerService.update(id, { ...data, updatedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "providers"] }); setProviderDialogOpen(false); setProviderEditingId(null); providerForm.reset(); toast.success("Conector atualizado"); },
  });

  const deleteProviderMut = useMutation({
    mutationFn: (id: string) => providerService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "providers"] }); toast.success("Conector excluído"); },
  });

  const createDsMut = useMutation({
    mutationFn: (data: DataSourceForm) => dataSourceService.create({
      name: data.name, description: data.description ?? "", type: data.type,
      status: data.status, config: {},
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "datasources"] }); setDsDialogOpen(false); dsForm.reset(); toast.success("Fonte de dados criada"); },
  });

  const updateDsMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DataSourceForm }) => dataSourceService.update(id, { ...data, updatedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "datasources"] }); setDsDialogOpen(false); setDsEditingId(null); dsForm.reset(); toast.success("Fonte de dados atualizada"); },
  });

  const deleteDsMut = useMutation({
    mutationFn: (id: string) => dataSourceService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "datasources"] }); toast.success("Fonte de dados excluída"); },
  });

  const testDsMut = useMutation({
    mutationFn: (id: string) => dataSourceService.test(id),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["admin", "datasources"] }); if (res.success) { toast.success(res.message); } else { toast.error(res.message); } },
    onError: () => { toast.error("Erro ao testar conexão"); },
  });

  const openProviderEdit = (id: string) => {
    const p = connectors.find((p) => p.id === id);
    if (!p) return;
    setProviderEditingId(id);
    providerForm.reset({ name: p.name, provider: p.provider, status: p.status, priority: p.priority, fallback: p.fallback });
    setProviderDialogOpen(true);
  };

  const openDsEdit = (id: string) => {
    const d = datasources.find((d) => d.id === id);
    if (!d) return;
    setDsEditingId(id);
    dsForm.reset({ name: d.name, description: d.description, type: d.type, status: d.status });
    setDsDialogOpen(true);
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

  const providerColumns: Column<ProviderConfig>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (p) => (
      <div className="flex items-center gap-2">
        <Cable className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{p.name}</span>
      </div>
    )},
    { key: "provider", header: "Provedor", render: (p) => <Badge variant="outline">{p.provider}</Badge> },
    { key: "status", header: "Status", render: (p) => statusBadge(p.status) },
    { key: "priority", header: "Prioridade", render: (p) => <span className="text-sm">{p.priority}</span> },
    { key: "fallback", header: "Fallback", render: (p) => p.fallback ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" /> },
    { key: "actions", header: "Ações", render: (p) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openProviderEdit(p.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setProviderDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  const dsColumns: Column<DataSource>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (d) => (
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{d.name}</span>
      </div>
    )},
    { key: "type", header: "Tipo", render: (d) => <Badge variant="outline">{d.type}</Badge> },
    { key: "status", header: "Status", render: (d) => statusBadge(d.status) },
    { key: "lastTest", header: "Último Teste", render: (d) => <span className="text-sm">{d.lastTest ? new Date(d.lastTest).toLocaleDateString() : "—"}</span> },
    { key: "testResult", header: "Resultado", render: (d) => d.testResult === "success" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : d.testResult === "failed" ? <XCircle className="h-4 w-4 text-destructive" /> : <span className="text-sm text-muted-foreground">—</span> },
    { key: "actions", header: "Ações", render: (d) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => testDsMut.mutate(d.id)} title="Testar conexão"><TestTube className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => openDsEdit(d.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDsDeleteId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("admin.connectors")}</h1>
          <DocButton module="admin" page="connectors" title="Conectores" />
        </div>
        <p className="text-sm text-muted-foreground">Gerencie conectores e fontes de dados</p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "providers" ? "default" : "outline"} onClick={() => setTab("providers")}>
          <Cable className="mr-2 h-4 w-4" />Provedores
        </Button>
        <Button variant={tab === "datasources" ? "default" : "outline"} onClick={() => setTab("datasources")}>
          <Database className="mr-2 h-4 w-4" />Fontes de Dados
        </Button>
      </div>

      {tab === "providers" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setProviderEditingId(null); providerForm.reset({ status: "active", priority: 0, fallback: false }); setProviderDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Novo Conector
            </Button>
          </div>
          <DataTable
            data={connectors}
            columns={providerColumns}
            keyExtractor={(p) => p.id}
            searchKeys={["name", "provider"]}
            initialSortColumn="name"
          />

          <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{providerEditingId ? "Editar Conector" : "Novo Conector"}</DialogTitle>
                <DialogDescription>Configure o conector</DialogDescription>
              </DialogHeader>
              <form onSubmit={providerForm.handleSubmit((v) => providerEditingId ? updateProviderMut.mutate({ id: providerEditingId, data: v }) : createProviderMut.mutate(v))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2"><Label>Nome</Label><Input {...providerForm.register("name")} /></div>
                  <div className="space-y-2"><Label>Provedor</Label><Input {...providerForm.register("provider")} /></div>
                  <div className="space-y-2"><Label>Status</Label>
                    <Select value={providerForm.watch("status")} onValueChange={(v) => providerForm.setValue("status", v as "active" | "inactive" | "error")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Prioridade</Label><Input type="number" {...providerForm.register("priority", { valueAsNumber: true })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" type="button" onClick={() => setProviderDialogOpen(false)}>{t("common.cancel")}</Button>
                  <Button type="submit">{t("common.save")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <ConfirmDialog
            open={!!providerDeleteId}
            onOpenChange={(o) => { if (!o) setProviderDeleteId(null); }}
            onConfirm={() => { if (providerDeleteId) { deleteProviderMut.mutate(providerDeleteId); setProviderDeleteId(null); } }}
          />
        </div>
      )}

      {tab === "datasources" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setDsEditingId(null); dsForm.reset({ status: "active" }); setDsDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Nova Fonte de Dados
            </Button>
          </div>
          <DataTable
            data={datasources}
            columns={dsColumns}
            keyExtractor={(d) => d.id}
            searchKeys={["name", "type", "description"]}
            initialSortColumn="name"
          />

          <Dialog open={dsDialogOpen} onOpenChange={setDsDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{dsEditingId ? "Editar Fonte de Dados" : "Nova Fonte de Dados"}</DialogTitle>
                <DialogDescription>Configure a fonte de dados</DialogDescription>
              </DialogHeader>
              <form onSubmit={dsForm.handleSubmit((v) => dsEditingId ? updateDsMut.mutate({ id: dsEditingId, data: v }) : createDsMut.mutate(v))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2"><Label>Nome</Label><Input {...dsForm.register("name")} /></div>
                  <div className="space-y-2 col-span-2"><Label>Descrição</Label><Textarea {...dsForm.register("description")} /></div>
                  <div className="space-y-2"><Label>Tipo</Label><Input {...dsForm.register("type")} placeholder="Ex: PostgreSQL, MySQL, API" /></div>
                  <div className="space-y-2"><Label>Status</Label>
                    <Select value={dsForm.watch("status")} onValueChange={(v) => dsForm.setValue("status", v as "active" | "inactive" | "error")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" type="button" onClick={() => setDsDialogOpen(false)}>{t("common.cancel")}</Button>
                  <Button type="submit">{t("common.save")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <ConfirmDialog
            open={!!dsDeleteId}
            onOpenChange={(o) => { if (!o) setDsDeleteId(null); }}
            onConfirm={() => { if (dsDeleteId) { deleteDsMut.mutate(dsDeleteId); setDsDeleteId(null); } }}
          />
        </div>
      )}
    </div>
  );
}