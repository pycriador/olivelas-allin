import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Flag, CheckCircle2, XCircle, Gauge } from "lucide-react";
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
import { featureFlagService } from "@/modules/admin/service";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { FeatureFlag } from "@/modules/admin/types";

const featureFlagSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  key: z.string().min(1, "Chave é obrigatória").regex(/^[a-z0-9_.-]+$/, "Apenas letras minúsculas, números, _, . e -"),
  enabled: z.boolean(),
  scope: z.enum(["global", "company", "user", "environment", "version"]),
  rolloutPercentage: z.number().min(0).max(100).optional(),
});

type FeatureFlagForm = z.infer<typeof featureFlagSchema>;

export const Route = createFileRoute("/_app/admin/feature-flags")({
  head: () => ({ meta: [{ title: "Admin Feature Flags — ServiceForge" }] }),
  component: AdminFeatureFlagsPage,
});

function AdminFeatureFlagsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: flags = [] } = useQuery({ queryKey: ["admin", "feature-flags", "list"], queryFn: () => featureFlagService.list() });

  const form = useForm<FeatureFlagForm>({
    resolver: zodResolver(featureFlagSchema),
    defaultValues: { enabled: false, scope: "global", rolloutPercentage: 100 },
  });

  const createMut = useMutation({
    mutationFn: (data: FeatureFlagForm) => featureFlagService.create({
      name: data.name, description: data.description ?? "", key: data.key,
      enabled: data.enabled, scope: data.scope, rolloutPercentage: data.rolloutPercentage,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "feature-flags"] }); setDialogOpen(false); form.reset(); toast.success("Feature flag criada"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeatureFlagForm }) => featureFlagService.update(id, { ...data, updatedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "feature-flags"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Feature flag atualizada"); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => featureFlagService.update(id, { enabled, updatedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "feature-flags"] }); toast.success("Feature flag atualizada"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => featureFlagService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "feature-flags"] }); toast.success("Feature flag excluída"); },
  });

  const openEdit = (id: string) => {
    const f = flags.find((f) => f.id === id);
    if (!f) return;
    setEditingId(id);
    form.reset({ name: f.name, description: f.description, key: f.key, enabled: f.enabled, scope: f.scope, rolloutPercentage: f.rolloutPercentage });
    setDialogOpen(true);
  };

  const scopeLabels: Record<string, string> = {
    global: "Global", company: "Empresa", user: "Usuário", environment: "Ambiente", version: "Versão",
  };

  const columns: Column<FeatureFlag>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (f) => (
      <div className="flex items-center gap-2">
        <Flag className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{f.name}</span>
      </div>
    )},
    { key: "key", header: "Chave", render: (f) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{f.key}</code> },
    { key: "enabled", header: "Ativo", render: (f) => (
      <Switch
        checked={f.enabled}
        onCheckedChange={(v) => toggleMut.mutate({ id: f.id, enabled: v })}
      />
    )},
    { key: "scope", header: "Escopo", render: (f) => <Badge variant="outline">{scopeLabels[f.scope]}</Badge> },
    { key: "rollout", header: "Rollout %", render: (f) => (
      <div className="flex items-center gap-2">
        <Gauge className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{f.rolloutPercentage ?? 100}%</span>
      </div>
    )},
    { key: "actions", header: "Ações", render: (f) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(f.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.featureFlags")}</h1>
            <DocButton module="admin" page="feature-flags" title="Feature Flags" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie os feature flags da plataforma</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ enabled: false, scope: "global", rolloutPercentage: 100 }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />{t("admin.newFeatureFlag")}
        </Button>
      </div>

      <DataTable
        data={flags}
        columns={columns}
        keyExtractor={(f) => f.id}
        searchKeys={["name", "key", "description"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t("admin.editFeatureFlag") : t("admin.newFeatureFlag")}</DialogTitle>
            <DialogDescription>Configure a feature flag</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
              <div className="space-y-2 col-span-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
              <div className="space-y-2"><Label>Chave</Label><Input {...form.register("key")} placeholder="ex: novo_modulo_vendas" /></div>
              <div className="space-y-2"><Label>Escopo</Label>
                <Select value={form.watch("scope")} onValueChange={(v) => form.setValue("scope", v as FeatureFlag["scope"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(scopeLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Rollout (%)</Label><Input type="number" min={0} max={100} {...form.register("rolloutPercentage", { valueAsNumber: true })} /></div>
              <div className="space-y-2 flex items-center gap-2 pt-6">
                <Switch checked={form.watch("enabled")} onCheckedChange={(v) => form.setValue("enabled", v)} />
                <Label>Ativo</Label>
              </div>
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