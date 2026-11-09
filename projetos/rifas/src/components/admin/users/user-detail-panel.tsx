import { Calendar, Hash, Mail, Shield, User as UserIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserStatusBadge } from "@/components/admin/users/user-status-badge";
import { UserRoleBadge } from "@/components/admin/users/user-role-badge";
import type { AdminUser } from "@/lib/admin-user-store";

interface UserDetailPanelProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onChangeRole: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserDetailPanel({
  user,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
  onChangeRole,
  onDelete,
}: UserDetailPanelProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detalhes do usuario</DialogTitle>
          <DialogDescription>Informacoes completas e acoes administrativas.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold truncate">{user.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <div className="mt-1.5 flex gap-1.5">
                <UserRoleBadge role={user.role} />
                <UserStatusBadge status={user.status} />
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow icon={Hash} label="ID" value={user.id} />
            <InfoRow icon={Shield} label="Role" value={user.role} />
            <InfoRow icon={UserIcon} label="Status" value={user.status} />
            <InfoRow icon={Mail} label="Departamento" value={user.department ?? "—"} />
            <InfoRow icon={Calendar} label="Criado em" value={fmtDate(user.createdAt)} />
            <InfoRow icon={Calendar} label="Ultimo acesso" value={fmtDate(user.lastLogin)} />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(user);
              }}
            >
              Editar usuario
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onChangeRole(user);
              }}
            >
              Alterar role
            </Button>
            <Button
              variant={user.status === "ACTIVE" ? "outline" : "secondary"}
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onToggleStatus(user);
              }}
            >
              {user.status === "ACTIVE" ? "Desativar" : "Ativar"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="ml-auto"
              onClick={() => {
                onOpenChange(false);
                onDelete(user);
              }}
            >
              Excluir usuario
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
