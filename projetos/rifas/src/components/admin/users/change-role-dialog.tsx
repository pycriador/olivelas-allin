import { useEffect, useState } from "react";
import { Loader2, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRoleBadge } from "@/components/admin/users/user-role-badge";
import type { RoleCode } from "@/types/profile";

const ROLE_OPTIONS: { value: RoleCode; label: string; description: string }[] = [
  {
    value: "GLOBAL_ADMIN",
    label: "Global Admin",
    description:
      "Acesso administrativo completo. Gerencia usuarios, roles e configuracoes globais.",
  },
  {
    value: "ADMIN",
    label: "Administrador",
    description: "Administrador operacional. Gerencia usuarios, campanhas e pagamentos.",
  },
  {
    value: "PUBLISHER",
    label: "Criador",
    description: "Criador de campanhas. Gerencia suas proprias campanhas e midias.",
  },
];

export interface ChangeRoleDialogUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ChangeRoleDialogProps {
  user: ChangeRoleDialogUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newRole: RoleCode) => void;
  currentRole: RoleCode;
  isPending?: boolean;
}

export function ChangeRoleDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  currentRole,
  isPending,
}: ChangeRoleDialogProps) {
  const [newRole, setNewRole] = useState<RoleCode>(
    ROLE_OPTIONS.some((r) => r.value === (user?.role as RoleCode))
      ? (user?.role as RoleCode)
      : "PUBLISHER",
  );

  useEffect(() => {
    if (open && user) {
      setNewRole(
        ROLE_OPTIONS.some((r) => r.value === (user.role as RoleCode))
          ? (user.role as RoleCode)
          : "PUBLISHER",
      );
    }
  }, [open, user]);

  if (!user) return null;

  const selectedOption = ROLE_OPTIONS.find((r) => r.value === newRole);
  const isSame = newRole === currentRole;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-amber-500" />
            Alterar funcao do usuario
          </DialogTitle>
          <DialogDescription>
            Esta acao pode conceder ou revogar permissoes administrativas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Funcao atual</p>
              <UserRoleBadge role={currentRole} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Nova funcao</p>
              <Select
                value={newRole}
                onValueChange={(v) => setNewRole(v as RoleCode)}
                disabled={isPending ?? false}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isSame && selectedOption ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Impacto da alteracao
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{selectedOption.description}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={() => onConfirm(newRole)} disabled={isSame || isPending}>
            {isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
            Confirmar alteracao
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
