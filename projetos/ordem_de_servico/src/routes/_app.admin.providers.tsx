import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Cable, CheckCircle2, XCircle, AlertCircle, Wifi, WifiOff, HeartPulse, Split } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { providerService } from "@/modules/admin/service";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { ProviderConfig } from "@/modules/admin/types";

const providerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["ai", "database", "storage", "mail", "auth", "connector"]),
  provider: z.string().min(1, "Provedor é obrigatório"),
  status: z.enum(["active", "inactive", "error"]),
  priority: z.number().min(0).optional(),
  fallback: z.boolean().optional(),
});

type ProviderForm = z.infer<typeof providerSchema>;

const typeLabels: Record<string, string> = {
  ai: "IA", database: "Banco de Dados", storage: "Armazenamento",
  mail: "Email", auth: "Autenticação", connector: "Conector",
};

export const Route = createFileRoute("/_app/admin/providers")({
  head: () => ({ meta: [{ title: "Admin Provedores — ServiceForge" }] }),
  component: AdminProvidersPage,
});

function AdminProvidersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [configEntries, setConfigEntries] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);

  const { data: providers = [] } = useQuery({ queryKey: ["admin", "providers", "list"], queryFn: () => providerService.list() });

  const form = useForm<ProviderForm>({
    resolver: zodResolver(providerSchema),
    defaultValues: { status: "active", priority: 0, fallback: false },
  });

  const createMut = useMutation({
    mutationFn: (data: ProviderForm) => providerService.create({
      name: data.name, type: data.type, provider: data.provider,
      status: data.status, priority: data.priority ?? 0, fallback: data.fallback ?? false,
      config: configEntries.filter(e => e.key).reduce((acc, e) => ({ ...acc, [e.key]: e.value }), {}),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "providers"] }); setDialogOpen(false); form.reset(); setConfigEntries([{ key: "", value: "" }]); toast.success("Provedor criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProviderForm }) => {
      const existing = providers.find(p => p.id === id);
      return providerService.update(id, {
        ...data, updatedAt: new Date().toISOString(),
        config: configEntries.filter(e => e.key).reduce((acc, e) => ({ ...acc, [e.key]: e.value }), {}) ?? existing?.config,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "providers"] }); setDialogOpen(false); setEditingId(null); form.reset(); setConfigEntries([{ key: "", value: "" }]); toast.success("Provedor atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => providerService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "providers"] }); toast.success("Provedor excluído"); },
  });

  const healthMut = useMutation({
    mutationFn: (id: string) => providerService.healthCheck(id),
    onSuccess: (res) => {
      if (!res) { toast.error("Provedor não encontrado"); return; }
      if (res.status === "healthy") toast.success(`Saudável — ${res.latency}ms`);
      else if (res.status === "degraded") toast.warning(`Degradado — ${res.latency}ms`);
      else toast.error(`Instável — ${res.latency}ms — ${res.error ?? ""}`);
    },
    onError: () => toast.error("Erro ao testar saúde"),
  });

  const openEdit = (id: string) => {
    const p = providers.find(p => p.id === id);
    if (!p) return;
    setEditingId(id);
    form.reset({ name: p.name, type: p.type, provider: p.provider, status: p.status, priority: p.priority, fallback: p.fallback });
    const entries = Object.entries(p.config).map(([k, v]) => ({ key: k, value: v }));
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

  const columns: Column<ProviderConfig>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (p) => (
      <div className="flex items-center gap-2">
        <Cable className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{p.name}</span>
      </div>
    )},
    { key: "type", header: "Tipo", render: (p) => <Badge variant="outline">{typeLabels[p.type] ?? p.type}</Badge> },
    { key: "provider", header: "Provedor", render: (p) => <Badge variant="secondary">{p.provider}</Badge> },
    { key: "status", header: "Status", render: (p) => statusBadge(p.status) },
    { key: "priority", header: "Prioridade", render: (p) => <span className="text-sm">{p.priority}</span> },
    { key: "fallback", header: "Fallback", render: (p) => p.fallback ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" /> },
    { key: "actions", header: "Ações", render: (p) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => healthMut.mutate(p.id)} title="Testar Saúde"><HeartPulse className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => openEdit(p.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.providers")}</h1>
            <DocButton module="admin" page="providers" title="Provedores" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie os provedores de serviços da plataforma</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ status: "active", priority: 0, fallback: false }); setConfigEntries([{ key: "", value: "" }]); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Novo Provedor
        </Button>
      </div>

      <DataTable
        data={providers}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchKeys={["name", "provider", "type"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Provedor" : "Novo Provedor"}</DialogTitle>
            <DialogDescription>Configure o provedor</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as ProviderConfig["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Provedor</Label><Input {...form.register("provider")} placeholder="Ex: OpenAI, AWS S3" /></div>
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
              <div className="space-y-2"><Label>Prioridade</Label><Input type="number" {...form.register("priority", { valueAsNumber: true })} /></div>
              <div className="space-y-2 flex items-center gap-2 pt-6">
                <Switch checked={form.watch("fallback")} onCheckedChange={(v) => form.setValue("fallback", v)} />
                <Label>Fallback</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Split className="h-3 w-3" /> Configuração (chave/valor)</Label>
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