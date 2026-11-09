import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Eye, EyeOff, Shield, Globe, Building2, Puzzle, Code } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { environmentConfigService } from "@/modules/admin/service";
import type { EnvironmentConfig } from "@/modules/admin/types";

const envSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  key: z.string().min(1, "Chave é obrigatória"),
  value: z.string().min(1, "Valor é obrigatório"),
  type: z.enum(["string", "number", "boolean", "json"]),
  scope: z.enum(["global", "company", "module"]),
  module: z.string().optional(),
  encrypted: z.boolean(),
});

type EnvForm = z.infer<typeof envSchema>;

const typeLabels: Record<string, string> = { string: "String", number: "Número", boolean: "Booleano", json: "JSON" };
const scopeLabels: Record<string, string> = { global: "Global", company: "Empresa", module: "Módulo" };
const scopeIcons: Record<string, typeof Globe> = { global: Globe, company: Building2, module: Puzzle };

export const Route = createFileRoute("/_app/admin/env")({
  head: () => ({ meta: [{ title: "Admin Variáveis de Ambiente — ServiceForge" }] }),
  component: AdminEnvPage,
});

function AdminEnvPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showEncrypted, setShowEncrypted] = useState(false);

  const { data: envs = [] } = useQuery({ queryKey: ["admin", "env", "list"], queryFn: () => environmentConfigService.list() });

  const form = useForm<EnvForm>({
    resolver: zodResolver(envSchema),
    defaultValues: { type: "string", scope: "global", encrypted: false },
  });

  const createMut = useMutation({
    mutationFn: (data: EnvForm) => environmentConfigService.create({
      name: data.name, key: data.key, value: data.value, type: data.type, scope: data.scope,
      module: data.module ?? "", encrypted: data.encrypted,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "env"] }); setDialogOpen(false); form.reset(); toast.success("Variável criada"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EnvForm }) => environmentConfigService.update(id, { ...data, updatedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "env"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Variável atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => environmentConfigService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "env"] }); toast.success("Variável excluída"); },
  });

  const openEdit = (id: string) => {
    const e = envs.find((e) => e.id === id);
    if (!e) return;
    setEditingId(id);
    form.reset({ name: e.name, key: e.key, value: e.value, type: e.type, scope: e.scope, module: e.module, encrypted: e.encrypted });
    setDialogOpen(true);
  };

  const columns: Column<EnvironmentConfig>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (e) => (
      <div className="flex items-center gap-2">
        <Code className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{e.name}</span>
      </div>
    )},
    { key: "key", header: "Chave", render: (e) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{e.key}</code> },
    { key: "value", header: "Valor", render: (e) => {
      const display = e.encrypted && !showEncrypted ? "••••••••" : e.value;
      return <span className="text-sm font-mono max-w-[200px] truncate block">{display}</span>;
    }},
    { key: "type", header: "Tipo", render: (e) => <Badge variant="outline">{typeLabels[e.type]}</Badge> },
    { key: "scope", header: "Escopo", render: (e) => {
      const Icon = scopeIcons[e.scope];
      return <Badge variant="secondary" className="gap-1"><Icon className="h-3 w-3" />{scopeLabels[e.scope]}</Badge>;
    }},
    { key: "module", header: "Módulo", render: (e) => <span className="text-sm">{e.module || "—"}</span> },
    { key: "encrypted", header: "Cripto", render: (e) => e.encrypted ? <Badge variant="destructive" className="gap-1"><Shield className="h-3 w-3" />Sim</Badge> : <Badge variant="secondary">Não</Badge> },
    { key: "actions", header: "Ações", render: (e) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(e.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Variáveis de Ambiente</h1>
            <DocButton module="admin" page="env" title="Variáveis de Ambiente" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie as variáveis de ambiente da plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEncrypted(!showEncrypted)}>
            {showEncrypted ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showEncrypted ? "Ocultar Valores" : "Mostrar Valores"}
          </Button>
          <Button onClick={() => { setEditingId(null); form.reset({ type: "string", scope: "global", encrypted: false }); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Nova Variável
          </Button>
        </div>
      </div>

      <DataTable
        data={envs}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchKeys={["name", "key", "value", "module"]}
        initialSortColumn="name"
        searchPlaceholder="Pesquisar variáveis..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Variável" : "Nova Variável"}</DialogTitle>
            <DialogDescription>Preencha os dados da variável de ambiente</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} placeholder="Minha Variável" /></div>
              <div className="space-y-2"><Label>Chave</Label><Input {...form.register("key")} placeholder="MINHA_VARIAVEL" /></div>
              <div className="space-y-2 col-span-2"><Label>Valor</Label><Textarea {...form.register("value")} rows={3} /></div>
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as EnvironmentConfig["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Escopo</Label>
                <Select value={form.watch("scope")} onValueChange={(v) => form.setValue("scope", v as EnvironmentConfig["scope"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(scopeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.watch("scope") === "module" && (
                <div className="space-y-2"><Label>Módulo</Label><Input {...form.register("module")} /></div>
              )}
              <div className="space-y-2 flex items-center gap-2 pt-6">
                <Switch checked={form.watch("encrypted")} onCheckedChange={(v) => form.setValue("encrypted", v)} />
                <Label>Criptografado</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
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
