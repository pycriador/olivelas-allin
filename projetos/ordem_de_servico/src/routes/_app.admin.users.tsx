import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit3, User as UserIcon, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { adminUserService, roleService } from "@/modules/admin/service";
import { companyService } from "@/modules/company/service";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { AdminUser } from "@/modules/admin/types";

const userSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  language: z.string().optional(),
  theme: z.string().optional(),
  primaryCompanyId: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});

type UserForm = z.infer<typeof userSchema>;

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({ meta: [{ title: "Admin Usuários — ServiceForge" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const { data: users = [] } = useQuery({ queryKey: ["admin", "users", "list"], queryFn: () => adminUserService.list() });
  const { data: roles = [] } = useQuery({ queryKey: ["admin", "roles", "list"], queryFn: () => roleService.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["admin", "companies"], queryFn: () => companyService.list() });

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { status: "active", language: "pt-BR", theme: "system", roleIds: [] },
  });

  const createMut = useMutation({
    mutationFn: (data: UserForm) => {
      const now = new Date().toISOString();
      return adminUserService.create({
        photoUrl: "", name: data.name, email: data.email, phone: data.phone ?? "", cpf: data.cpf ?? "",
        position: data.position ?? "", status: data.status, language: data.language ?? "pt-BR",
        theme: data.theme ?? "system", primaryCompanyId: "", linkedCompanyIds: [],
        roleIds: selectedRoleId ? [selectedRoleId] : [], specialPermissions: [],
        lastAccess: now, createdAt: now, updatedAt: now,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); setDialogOpen(false); form.reset(); setSelectedRoleId(""); toast.success("Usuário criado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserForm }) => {
      return adminUserService.update(id, { ...data, updatedAt: new Date().toISOString(), roleIds: selectedRoleId ? [selectedRoleId] : [] });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); setDialogOpen(false); setEditingId(null); form.reset(); toast.success("Usuário atualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminUserService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast.success("Usuário excluído"); },
  });

  const openEdit = async (id: string) => {
    const u = users.find((u) => u.id === id);
    if (!u) return;
    setEditingId(id);
    setSelectedRoleId(u.roleIds[0] ?? "");
    form.reset({
      name: u.name, email: u.email, phone: u.phone, cpf: u.cpf,
      position: u.position, status: u.status, language: u.language, theme: u.theme,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setSelectedRoleId("");
    form.reset({ status: "active", language: "pt-BR", theme: "system" });
    setDialogOpen(true);
  };

  const getRoleBadge = (roleIds: string[]) => {
    const role = roles.find((r) => r.id === roleIds[0]);
    if (!role) return <Badge variant="secondary">—</Badge>;
    return <Badge style={{ backgroundColor: role.color, color: "white" }}>{role.name}</Badge>;
  };

  const columns: Column<AdminUser>[] = [
    { key: "name", header: "Nome", sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name), render: (u) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{u.name.charAt(0)}{u.name.split(" ")[1]?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{u.name}</div>
          <div className="text-xs text-muted-foreground">{u.email}</div>
        </div>
      </div>
    )},
    { key: "position", header: "Cargo", render: (u) => <span className="text-sm">{u.position || "—"}</span> },
    { key: "role", header: "Papel", render: (u) => getRoleBadge(u.roleIds) },
    { key: "status", header: "Status", render: (u) => (
      <Badge variant={u.status === "active" ? "default" : "secondary"} className="gap-1">
        {u.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {u.status === "active" ? "Ativo" : "Inativo"}
      </Badge>
    )},
    { key: "lastAccess", header: "Último Acesso", render: (u) => <span className="text-sm">{new Date(u.lastAccess).toLocaleDateString()}</span> },
    { key: "actions", header: "Ações", render: (u) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => openEdit(u.id)}><Edit3 className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => setDeleteId(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.users")}</h1>
            <DocButton module="admin" page="users" title="Usuários" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie os usuários da plataforma</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />{t("admin.newUser")}</Button>
      </div>

      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(u) => u.id}
        searchKeys={["name", "email", "cpf", "position"]}
        initialSortColumn="name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t("admin.editUser") : t("admin.newUser")}</DialogTitle>
            <DialogDescription>Preencha os dados do usuário</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => editingId ? updateMut.mutate({ id: editingId, data: v }) : createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Nome</Label><Input {...form.register("name")} /></div>
              <div className="space-y-2 col-span-2"><Label>Email</Label><Input type="email" {...form.register("email")} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input {...form.register("phone")} /></div>
              <div className="space-y-2">CPF<Label /><Input {...form.register("cpf")} /></div>
              <div className="space-y-2"><Label>Cargo</Label><Input {...form.register("position")} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as "active" | "inactive")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Idioma</Label>
                <Select value={form.watch("language")} onValueChange={(v) => form.setValue("language", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (BR)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Papel</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
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
