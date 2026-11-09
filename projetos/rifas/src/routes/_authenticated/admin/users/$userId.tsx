import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Hash, Mail, Shield, User as UserIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { UserStatusBadge } from "@/components/admin/users/user-status-badge";
import { UserRoleBadge } from "@/components/admin/users/user-role-badge";
import { UserForm } from "@/components/admin/users/user-form";
import { useAdminUsers } from "@/lib/admin-user-store";
import { useAuth } from "@/contexts/auth-context";
import { ChangeRoleDialog } from "@/components/admin/users/change-role-dialog";
import type { RoleCode } from "@/types/profile";

export const Route = createFileRoute("/_authenticated/admin/users/$userId")({
  head: () => ({ meta: [{ title: "Detalhes do Usuario — Admin — RaffleHub" }] }),
  component: AdminUserDetailPage,
});

function AdminUserDetailPage() {
  const { userId } = Route.useParams();
  const { users, updateUser, deleteUser, setStatus, setRole } = useAdminUsers();
  const { currentUser } = useAuth();
  const actorId = currentUser?.id ?? null;
  const navigate = useNavigate();
  const user = users.find((u) => u.id === userId);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  if (!user) {
    return (
      <Card className="py-16">
        <CardContent>
          <EmptyState
            title="Usuario nao encontrado"
            description="O usuario solicitado nao existe ou foi removido."
          />
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/users" })}>
              Voltar para usuarios
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Voltar para usuarios
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex gap-1.5">
              <UserRoleBadge role={user.role} />
              <UserStatusBadge status={user.status} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRoleDialogOpen(true)}>
            Alterar role
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            Excluir
          </Button>
        </div>
      </div>

      <Separator />

      {/* Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informacoes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Mail} label="E-mail" value={user.email} />
            <InfoRow icon={Shield} label="Role" value={user.role}>
              <UserRoleBadge role={user.role} />
            </InfoRow>
            <InfoRow icon={UserIcon} label="Status" value={user.status}>
              <UserStatusBadge status={user.status} />
            </InfoRow>
            <InfoRow icon={UserIcon} label="Departamento" value={user.department ?? "—"} />
            <InfoRow icon={Calendar} label="Criado em" value={fmt(user.createdAt)} />
            <InfoRow icon={Calendar} label="Ultimo acesso" value={fmt(user.lastLogin)} />
            <InfoRow icon={Calendar} label="Atualizado em" value={fmt(user.updatedAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados Tecnicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Hash} label="ID" value={user.id} />
            <InfoRow icon={Shield} label="Avatar" value={user.avatar ? "Sim" : "—"} />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => {
          updateUser(user.id, data, actorId ?? undefined);
          setFormOpen(false);
        }}
        existingEmails={users.map((u) => u.email)}
        user={user}
      />

      <ConfirmDelete
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir usuario?"
        description={`Tem certeza que deseja excluir permanentemente "${user.name}" (${user.email})? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir usuario"
        onConfirm={() => {
          deleteUser(user.id, actorId ?? undefined);
          setDeleteOpen(false);
          navigate({ to: "/admin/users" });
        }}
      />

      <ChangeRoleDialog
        user={user}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        currentRole={user.role}
        onConfirm={(newRole: RoleCode) => {
          setRole(user.id, newRole, actorId ?? undefined);
          setRoleDialogOpen(false);
        }}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {children ?? <p className="text-sm truncate">{value}</p>}
      </div>
    </div>
  );
}

function fmt(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
