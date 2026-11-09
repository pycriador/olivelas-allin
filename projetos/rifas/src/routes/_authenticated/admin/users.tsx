import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserTable } from "@/features/users/components/user-table";
import { ChangeRoleDialog } from "@/components/admin/users/change-role-dialog";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useDeleteUser,
  useRestoreUser,
  useSetUserRole,
  useSetUserStatus,
  useUpdateUser,
  useUsers,
} from "@/hooks/use-users";
import type { UserSortField } from "@/services/user.service";
import type { ProfileStatus, ProfileWithRole, RoleCode } from "@/types/profile";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Usuarios — Admin — RaffleHub" }] }),
  component: AdminUsersPage,
});

const PAGE_SIZE = 15;

function AdminUsersPage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = can("users.edit");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ProfileStatus>("all");
  const [role, setRole] = useState<"all" | RoleCode>("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<UserSortField>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editing, setEditing] = useState<ProfileWithRole | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<ProfileWithRole | null>(null);

  useEffect(() => setPage(1), [search, status, role, includeDeleted]);

  const query = useUsers({
    page,
    pageSize: PAGE_SIZE,
    sortBy,
    sortDir,
    includeDeleted,
    ...(search ? { search } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(role !== "all" ? { role } : {}),
  });

  const updateUser = useUpdateUser();
  const setUserStatus = useSetUserStatus();
  const setUserRoleH = useSetUserRole();
  const deleteUser = useDeleteUser();
  const restoreUser = useRestoreUser();

  const handleSort = (columnId: string) => {
    const field = columnId as UserSortField;
    if (field === sortBy) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const handleToggleStatus = (row: ProfileWithRole) => {
    const newStatus: ProfileStatus = row.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    setUserStatus.mutate(
      { userId: row.id, status: newStatus },
      {
        onSuccess: () =>
          toast.success(newStatus === "ACTIVE" ? "Usuario ativado." : "Usuario desativado."),
        onError: (err) => toast.error("Falha ao alterar status", { description: err.message }),
      },
    );
  };

  const handleChangeRole = (row: ProfileWithRole) => {
    setRoleTarget(row);
    setRoleDialogOpen(true);
  };

  const handleConfirmRoleChange = (newRole: RoleCode) => {
    if (!roleTarget) return;
    setUserRoleH.mutate(
      { userId: roleTarget.id, role: newRole },
      {
        onSuccess: () => toast.success("Role alterada com sucesso."),
        onError: (err) => toast.error("Falha ao alterar role", { description: err.message }),
      },
    );
    setRoleDialogOpen(false);
    setRoleTarget(null);
  };

  const handleDelete = (row: ProfileWithRole) => {
    deleteUser.mutate(row.id, {
      onSuccess: () => toast.success("Conta excluida."),
      onError: (err) => toast.error("Falha ao excluir", { description: err.message }),
    });
  };

  const handleRestore = (row: ProfileWithRole) => {
    restoreUser.mutate(row.id, {
      onSuccess: () => toast.success("Conta restaurada."),
      onError: (err) => toast.error("Falha ao restaurar", { description: err.message }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestao de contas, papeis e status de acesso da plataforma.
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button disabled className="shrink-0 gap-2">
                <UserPlus className="size-4" /> Novo usuario
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-sm">
              Usuarios sao criados atraves do fluxo de autenticacao (Google ou e-mail).
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar usuarios"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="w-40" aria-label="Filtrar por status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ACTIVE">Ativos</SelectItem>
                <SelectItem value="DISABLED">Desativados</SelectItem>
                <SelectItem value="INACTIVE">Inativos</SelectItem>
                <SelectItem value="SUSPENDED">Suspensos</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger className="w-44" aria-label="Filtrar por role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as roles</SelectItem>
                <SelectItem value="GLOBAL_ADMIN">Global Admin</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="PUBLISHER">Criador</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                id="include-deleted-admin"
                checked={includeDeleted}
                onCheckedChange={setIncludeDeleted}
              />
              <Label htmlFor="include-deleted-admin" className="text-sm text-muted-foreground">
                Excluidos
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <UserTable
            rows={query.data?.rows ?? []}
            total={query.data?.total ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={handleSort}
            isLoading={query.isPending}
            isError={query.isError}
            onRetry={() => void query.refetch()}
            currentUserId={user?.id ?? null}
            canManage={canManage}
            onEdit={setEditing}
            onToggleStatus={handleToggleStatus}
            onChangeRole={handleChangeRole}
            onDelete={handleDelete}
            onRestore={handleRestore}
          />
        </CardContent>
      </Card>

      <EditUserDialog
        user={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        isPending={updateUser.isPending}
        onSubmit={(values) => {
          if (!editing) return;
          updateUser.mutate(
            {
              userId: editing.id,
              name: values.name,
              avatar_url: values.avatar_url,
              previous: { name: editing.name, avatar_url: editing.avatar_url },
            },
            {
              onSuccess: () => {
                toast.success("Usuario atualizado.");
                setEditing(null);
              },
              onError: (err) => toast.error("Falha ao salvar", { description: err.message }),
            },
          );
        }}
      />

      <ChangeRoleDialog
        user={
          roleTarget
            ? {
                id: roleTarget.id,
                name: roleTarget.name,
                email: roleTarget.email,
                role: roleTarget.role,
              }
            : null
        }
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        isPending={setUserRoleH.isPending}
        currentRole={(roleTarget?.role as RoleCode) ?? "PUBLISHER"}
        onConfirm={handleConfirmRoleChange}
      />
    </div>
  );
}

function EditUserDialog({
  user,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  user: ProfileWithRole | null;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (values: { name: string; avatar_url: string | null }) => void;
}) {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    setName(user?.name ?? "");
    setAvatarUrl(user?.avatar_url ?? "");
  }, [user]);

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ name: name.trim(), avatar_url: avatarUrl.trim() || null });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="edit-name-admin">Nome</Label>
            <Input
              id="edit-name-admin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-avatar-admin">URL do avatar</Label>
            <Input
              id="edit-avatar-admin"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              inputMode="url"
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
