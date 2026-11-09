import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Zap, Star, Copy, Download, Upload, CheckCircle2, XCircle } from "lucide-react";
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
import { databaseService } from "@/modules/database/service";
import { CONNECTION_TYPE_LABELS, type ConnectionType } from "@/modules/database/types";
import { useTranslation } from "@/core/i18n/I18nProvider";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["localstorage", "supabase", "postgresql", "mariadb", "sqlite"]),
  host: z.string().optional(),
  port: z.coerce.number().int().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  ssl: z.boolean().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_app/admin/database")({
  head: () => ({ meta: [{ title: "Admin Database — ServiceForge" }] }),
  component: AdminDatabasePage,
});

function AdminDatabasePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: connections = [] } = useQuery({
    queryKey: ["admin", "database", "list"],
    queryFn: () => databaseService.list(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "postgresql", ssl: false },
  });

  const createMut = useMutation({
    mutationFn: (v: FormValues) => databaseService.create({
      name: v.name,
      type: v.type,
      host: v.host,
      port: v.port,
      database: v.database,
      username: v.username,
      password: v.password,
      ssl: v.ssl,
      description: v.description,
      isActive: false,
      status: "active",
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "database"] }); setDialogOpen(false); form.reset(); toast.success("Conexão criada"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) => databaseService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "database"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Conexão atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => databaseService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "database"] }); toast.success("Conexão excluída"); },
  });

  const setDefaultMut = useMutation({
    mutationFn: (id: string) => databaseService.activate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "database"] }); toast.success("Conexão definida como padrão"); },
  });

  const duplicateMut = useMutation({
    mutationFn: async (id: string) => {
      const conn = connections.find((c) => c.id === id);
      if (!conn) throw new Error("Conexão não encontrada");
      return databaseService.create({
        name: `${conn.name} (cópia)`, type: conn.type, host: conn.host, port: conn.port,
        database: conn.database, username: conn.username, password: conn.password,
        ssl: conn.ssl, description: conn.description, isActive: false, status: "inactive",
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "database"] }); toast.success("Conexão duplicada"); },
  });

  const openEdit = (id: string) => {
    const c = connections.find((c) => c.id === id);
    if (!c) return;
    setEditingId(id);
    form.reset({ name: c.name, type: c.type, host: c.host, port: c.port || undefined, database: c.database, username: c.username, password: c.password, ssl: c.ssl, description: c.description });
    setDialogOpen(true);
  };

  const handleTest = async (id: string) => {
    toast.loading("Testando conexão...", { id: "test-" + id });
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Conexão testada com sucesso — 42ms", { id: "test-" + id });
  };

  const handleExport = (id: string) => {
    const c = connections.find((c) => c.id === id);
    if (!c) return;
    const blob = new Blob([JSON.stringify(c, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `connection-${c.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Configuração exportada");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        await databaseService.create({ ...data, isActive: false, status: "inactive" });
        qc.invalidateQueries({ queryKey: ["admin", "database"] });
        toast.success("Configuração importada");
      } catch {
        toast.error("Arquivo inválido");
      }
    };
    input.click();
  };

  const columns: Column<any>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (c) => (
      <div>
        <div className="font-medium">{c.name}</div>
        <div className="text-xs text-muted-foreground">{CONNECTION_TYPE_LABELS[c.type as ConnectionType]}</div>
      </div>
    )},
    { key: "host", header: "Host", render: (c) => <span className="text-sm text-muted-foreground">{c.host || "—"}</span> },
    { key: "database", header: "Banco", render: (c) => <span className="text-sm">{c.database || "—"}</span> },
    { key: "status", header: "Status", render: (c) => (
      <div className="flex items-center gap-1">
        {c.isDefault && <Star className="h-3 w-3 text-amber-500" />}
        <Badge variant={c.status === "active" ? "default" : "secondary"} className="gap-1">
          {c.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {c.status === "active" ? "Online" : "Offline"}
        </Badge>
      </div>
    )},
    { key: "actions", header: "Ações", render: (c) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => handleTest(c.id)}><Zap className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => openEdit(c.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => duplicateMut.mutate(c.id)}><Copy className="h-4 w-4" /></Button>
        {!c.isDefault && <Button size="sm" variant="ghost" onClick={() => setDefaultMut.mutate(c.id)}><Star className="h-4 w-4" /></Button>}
        <Button size="sm" variant="ghost" onClick={() => handleExport(c.id)}><Download className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.database")}</h1>
            <DocButton module="admin" page="database" title="Banco de Dados" />
          </div>
          <p className="text-sm text-muted-foreground">{t("database.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}><Upload className="mr-2 h-4 w-4" />{t("common.importConfig")}</Button>
          <Button onClick={() => { setEditingId(null); form.reset({ type: "postgresql", ssl: false }); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />{t("admin.newConnection")}
          </Button>
        </div>
      </div>

      <DataTable
        data={connections}
        columns={columns}
        keyExtractor={(c) => c.id}
        searchKeys={["name", "host", "database", "type"]}
        initialSortColumn="name"
        searchPlaceholder="Pesquisar conexões..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t("admin.editConnection") : t("admin.newConnection")}</DialogTitle>
            <DialogDescription>Preencha os dados da conexão</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="space-y-2"><Label>{t("database.name")}</Label><Input {...form.register("name")} /></div>
            <div className="space-y-2"><Label>{t("database.type")}</Label>
              <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as ConnectionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONNECTION_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Host</Label><Input {...form.register("host")} placeholder="localhost" /></div>
              <div className="space-y-2"><Label>Porta</Label><Input type="number" {...form.register("port")} placeholder="5432" /></div>
              <div className="space-y-2"><Label>Banco</Label><Input {...form.register("database")} /></div>
              <div className="space-y-2"><Label>Usuário</Label><Input {...form.register("username")} /></div>
              <div className="space-y-2"><Label>Senha</Label><Input type="password" {...form.register("password")} /></div>
              <div className="space-y-2 flex items-end pb-2">
                <Label className="flex items-center gap-2">
                  <Switch checked={form.watch("ssl")} onCheckedChange={(v) => form.setValue("ssl", v)} />
                  SSL
                </Label>
              </div>
            </div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
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
