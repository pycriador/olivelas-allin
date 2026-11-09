import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, Users, CheckCircle2, XCircle } from "lucide-react";
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
import { groupService, roleService } from "@/modules/admin/service";
import { companyService } from "@/modules/company/service";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { AdminGroup } from "@/modules/admin/types";

const groupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["system", "custom"]),
  memberIds: z.array(z.string()).optional(),
  roleId: z.string().optional(),
  companyId: z.string().optional(),
});

type GroupForm = z.infer<typeof groupSchema>;

export const Route = createFileRoute("/_app/admin/groups")({
  head: () => ({ meta: [{ title: "Admin Grupos — ServiceForge" }] }),
  component: AdminGroupsPage,
});

function AdminGroupsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: groups = [] } = useQuery({ queryKey: ["admin", "groups", "list"], queryFn: () => groupService.list() });
  const { data: roles = [] } = useQuery({ queryKey: ["admin", "roles", "list"], queryFn: () => roleService.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["admin", "companies"], queryFn: () => companyService.list() });

  const form = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: { type: "custom", memberIds: [] },
  });

  const createMut = useMutation({
    mutationFn: (data: GroupForm) => groupService.create({
      name: data.name, description: data.description ?? "", type: data.type,
      memberIds: data.memberIds ?? [], roleId: data.roleId, companyId: data.companyId,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "groups"] }); setDialogOpen(false); form.reset(); toast.success("Grupo criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GroupForm }) => groupService.update(id, { ...data, updatedAt: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "groups"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Grupo atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => groupService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "groups"] }); toast.success("Grupo excluído"); },
  });

  const openEdit = (id: string) => {
    const g = groups.find((g) => g.id === id);
    if (!g) return;
    setEditingId(id);
    form.reset({ name: g.name, description: g.description, type: g.type, memberIds: g.memberIds, roleId: g.roleId, companyId: g.companyId });
    setDialogOpen(true);
  };

  const columns: Column<AdminGroup>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (g) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{g.name}</span>
      </div>
    )},
    { key: "description", header: "Descrição", render: (g) => <span className="text-sm text-muted-foreground">{g.description || "—"}</span> },
    { key: "type", header: "Tipo", render: (g) => (
      <Badge variant={g.type === "system" ? "default" : "secondary"}>{g.type === "system" ? "Sistema" : "Personalizado"}</Badge>
    )},
    { key: "memberCount", header: "Membros", render: (g) => <Badge variant="outline">{g.memberIds.length}</Badge> },
    { key: "role", header: "Papel", render: (g) => {
      const role = roles.find((r) => r.id === g.roleId);
      return role ? <Badge style={{ backgroundColor: role.color, color: "white" }}>{role.name}</Badge> : <span className="text-sm text-muted-foreground">—</span>;
    }},
    { key: "company", header: "Empresa", render: (g) => {
      const company = companies.find((c) => c.id === g.companyId);
      return <span className="text-sm">{company?.tradeName ?? "—"}</span>;
    }},
    { key: "actions", header: "Ações", render: (g) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(g.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.groups")}</h1>
            <DocButton module="admin" page="groups" title="Grupos" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie os grupos da plataforma</p>
        </div>
        <Button onClick={() => { setEditingId(null); form.reset({ type: "custom", memberIds: [] }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />{t("admin.newGroup")}
        </Button>
      </div>

      <DataTable
        data={groups}
        columns={columns}
        keyExtractor={(g) => g.id}
        searchKeys={["name", "description"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t("admin.editGroup") : t("admin.newGroup")}</DialogTitle>
            <DialogDescription>Preencha os dados do grupo</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as "system" | "custom")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Papel</Label>
                <Select value={form.watch("roleId") ?? ""} onValueChange={(v) => form.setValue("roleId", v || undefined)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Empresa</Label>
                <Select value={form.watch("companyId") ?? ""} onValueChange={(v) => form.setValue("companyId", v || undefined)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.tradeName}</SelectItem>)}
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