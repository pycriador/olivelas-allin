import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Shield, CheckCircle2, XCircle } from "lucide-react";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { roleService } from "@/modules/admin/service";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { Role } from "@/modules/admin/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const roleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type RoleForm = z.infer<typeof roleSchema>;

export const Route = createFileRoute("/_app/admin/roles")({
  head: () => ({ meta: [{ title: "Admin Papéis — ServiceForge" }] }),
  component: AdminRolesPage,
});

function AdminRolesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const { data: roles = [] } = useQuery({ queryKey: ["admin", "roles", "list"], queryFn: () => roleService.list() });

  const form = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: { status: "active" },
  });

  const createMut = useMutation({
    mutationFn: (data: RoleForm) => roleService.create({
      name: data.name, description: data.description ?? "", color: data.color ?? "#6B7280",
      icon: data.icon ?? "Shield", permissions: [], status: data.status,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "roles"] }); setDialogOpen(false); form.reset(); toast.success("Papel criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleForm }) => roleService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "roles"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Papel atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => roleService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "roles"] }); toast.success("Papel excluído"); },
  });

  const openEdit = (id: string) => {
    const r = roles.find((r) => r.id === id);
    if (!r) return;
    setEditingId(id);
    form.reset({ name: r.name, description: r.description, color: r.color, icon: r.icon, status: r.status });
    setDialogOpen(true);
  };

  const columns: Column<Role>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (r) => (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full" style={{ backgroundColor: r.color }} />
        <span className="font-medium">{r.name}</span>
      </div>
    )},
    { key: "description", header: "Descrição", render: (r) => <span className="text-sm text-muted-foreground">{r.description}</span> },
    { key: "permissions", header: "Permissões", render: (r) => <Badge variant="outline">{r.permissions.length} recursos</Badge> },
    { key: "status", header: "Status", render: (r) => (
      <Badge variant={r.status === "active" ? "default" : "secondary"} className="gap-1">
        {r.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {r.status === "active" ? "Ativo" : "Inativo"}
      </Badge>
    )},
    { key: "actions", header: "Ações", render: (r) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => { setSelectedRole(r); }}><Shield className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => openEdit(r.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.roles")}</h1>
            <DocButton module="admin" page="roles" title="Papéis" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie os papéis e permissões da plataforma</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ status: "active" }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />{t("admin.newRole")}
        </Button>
      </div>

      <DataTable
        data={roles}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchKeys={["name", "description"]}
        initialSortColumn="name"
      />

      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedRole.color }} />
              {t("admin.permissionsFor")}: {selectedRole.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Recurso</th>
                    <th className="text-center py-2 px-2 font-medium">Ver</th>
                    <th className="text-center py-2 px-2 font-medium">Criar</th>
                    <th className="text-center py-2 px-2 font-medium">Editar</th>
                    <th className="text-center py-2 px-2 font-medium">Excluir</th>
                    <th className="text-center py-2 px-2 font-medium">Imprimir</th>
                    <th className="text-center py-2 px-2 font-medium">Exportar</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRole.permissions.map((p) => (
                    <tr key={p.resource} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium capitalize">{p.resource}</td>
                      <td className="text-center py-2 px-2">{p.canView ? "✓" : "—"}</td>
                      <td className="text-center py-2 px-2">{p.canCreate ? "✓" : "—"}</td>
                      <td className="text-center py-2 px-2">{p.canEdit ? "✓" : "—"}</td>
                      <td className="text-center py-2 px-2">{p.canDelete ? "✓" : "—"}</td>
                      <td className="text-center py-2 px-2">{p.canPrint ? "✓" : "—"}</td>
                      <td className="text-center py-2 px-2">{p.canExport ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t("admin.editRole") : t("admin.newRole")}</DialogTitle>
            <DialogDescription>Preencha os dados do perfil</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cor</Label><Input type="color" {...form.register("color")} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as "active" | "inactive")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
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
