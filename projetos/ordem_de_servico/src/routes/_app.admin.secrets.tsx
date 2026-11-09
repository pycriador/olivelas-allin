import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Key, Globe, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
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
import { secretService } from "@/modules/admin/service";
import type { SecretEntry } from "@/modules/admin/types";

const secretSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  key: z.string().min(1, "Chave é obrigatória"),
  description: z.string().optional(),
  scope: z.enum(["global", "company"]),
  companyId: z.string().optional(),
  expiresAt: z.string().optional(),
});

type SecretForm = z.infer<typeof secretSchema>;

const scopeLabels: Record<string, string> = { global: "Global", company: "Empresa" };

export const Route = createFileRoute("/_app/admin/secrets")({
  head: () => ({ meta: [{ title: "Admin Segredos — ServiceForge" }] }),
  component: AdminSecretsPage,
});

function AdminSecretsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: secrets = [] } = useQuery({ queryKey: ["admin", "secrets", "list"], queryFn: () => secretService.list() });

  const form = useForm<SecretForm>({
    resolver: zodResolver(secretSchema),
    defaultValues: { scope: "global" },
  });

  const createMut = useMutation({
    mutationFn: (data: SecretForm) => secretService.create({
      name: data.name, key: data.key, description: data.description ?? "", scope: data.scope,
      companyId: data.companyId ?? "", expiresAt: data.expiresAt || undefined,
      maskedValue: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "secrets"] }); setDialogOpen(false); form.reset(); toast.success("Segredo criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SecretForm }) => secretService.update(id, { ...data, updatedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "secrets"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Segredo atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => secretService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "secrets"] }); toast.success("Segredo excluído"); },
  });

  const openEdit = (id: string) => {
    const s = secrets.find((s) => s.id === id);
    if (!s) return;
    setEditingId(id);
    form.reset({ name: s.name, key: s.key, description: s.description, scope: s.scope, companyId: s.companyId, expiresAt: s.expiresAt ? s.expiresAt.slice(0, 16) : "" });
    setDialogOpen(true);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const columns: Column<SecretEntry>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (s) => (
      <div className="flex items-center gap-2">
        <Key className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{s.name}</span>
      </div>
    )},
    { key: "key", header: "Chave", render: (s) => <span className="text-sm text-muted-foreground">••••••••{s.key.slice(-4)}</span> },
    { key: "description", header: "Descrição", render: (s) => <span className="text-sm max-w-[200px] truncate block">{s.description || "—"}</span> },
    { key: "scope", header: "Escopo", render: (s) => (
      <Badge variant="outline" className="gap-1">
        {s.scope === "global" ? <Globe className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
        {scopeLabels[s.scope]}
      </Badge>
    )},
    { key: "expiresAt", header: "Expiração", render: (s) => {
      if (!s.expiresAt) return <Badge variant="secondary">Sem expiração</Badge>;
      const expired = isExpired(s.expiresAt);
      return (
        <Badge variant={expired ? "destructive" : "outline"} className="gap-1">
          {expired ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
          {expired ? "Expirado" : new Date(s.expiresAt).toLocaleDateString()}
        </Badge>
      );
    }},
    { key: "actions", header: "Ações", render: (s) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(s.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Segredos</h1>
            <DocButton module="admin" page="secrets" title="Segredos" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie chaves e segredos da plataforma</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ scope: "global" }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Novo Segredo
        </Button>
      </div>

      <DataTable
        data={secrets}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchKeys={["name", "key", "description"]}
        initialSortColumn="name"
        searchPlaceholder="Pesquisar segredos..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Segredo" : "Novo Segredo"}</DialogTitle>
            <DialogDescription>Preencha os dados do segredo</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} placeholder="Chave API" /></div>
              <div className="space-y-2"><Label>Chave</Label><Input {...form.register("key")} placeholder="api_key_externa" /></div>
              <div className="space-y-2 col-span-2"><Label>Descrição</Label><Textarea {...form.register("description")} rows={2} /></div>
              <div className="space-y-2"><Label>Escopo</Label>
                <Select value={form.watch("scope")} onValueChange={(v) => form.setValue("scope", v as SecretEntry["scope"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(scopeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Expira em</Label><Input type="datetime-local" {...form.register("expiresAt")} /></div>
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
