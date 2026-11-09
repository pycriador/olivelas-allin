import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { ROLE_LABELS } from "@/lib/permissions";
import type { ProfileWithRole } from "@/types/profile";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function initials(name: string, email: string) {
  const source = name.trim() || email;
  return (
    source
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export interface UserTableProps {
  rows: ProfileWithRole[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  sortDir: "asc" | "desc";
  onSortChange: (columnId: string) => void;
  currentUserId: string | null;
  canManage: boolean;
  onEdit: (row: ProfileWithRole) => void;
  onToggleStatus: (row: ProfileWithRole) => void;
  onChangeRole: (row: ProfileWithRole) => void;
  onDelete: (row: ProfileWithRole) => void;
  onRestore: (row: ProfileWithRole) => void;
}

export function UserTable({
  rows,
  isLoading,
  isError,
  onRetry,
  page,
  pageSize,
  total,
  onPageChange,
  sortBy,
  sortDir,
  onSortChange,
  currentUserId,
  canManage,
  onEdit,
  onToggleStatus,
  onChangeRole,
  onDelete,
  onRestore,
}: UserTableProps) {
  const [pendingDelete, setPendingDelete] = useState<ProfileWithRole | null>(null);

  const columns: DataTableColumn<ProfileWithRole>[] = [
    {
      id: "name",
      header: "Usuário",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            {row.avatar_url ? <AvatarImage src={row.avatar_url} alt="" /> : null}
            <AvatarFallback className="text-xs">{initials(row.name, row.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.name || "—"}</p>
            <p className="truncate text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Papel",
      sortable: false,
      cell: (row) => (
        <Badge
          variant={
            row.role === "GLOBAL_ADMIN" ? "default" : row.role === "ADMIN" ? "secondary" : "outline"
          }
        >
          {ROLE_LABELS[row.role] ?? row.role}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (row) =>
        row.deleted_at ? (
          <Badge variant="outline" className="text-muted-foreground">
            Excluído
          </Badge>
        ) : (
          <Badge variant={row.status === "ACTIVE" ? "secondary" : "destructive"}>
            {row.status === "ACTIVE" ? "Ativo" : "Desativado"}
          </Badge>
        ),
    },
    {
      id: "created_at",
      header: "Criado em",
      sortable: true,
      className: "whitespace-nowrap text-xs text-muted-foreground",
      cell: (row) => dateTime.format(new Date(row.created_at)),
    },
    {
      id: "last_login",
      header: "Último acesso",
      sortable: true,
      className: "whitespace-nowrap text-xs text-muted-foreground",
      cell: (row) => (row.last_login ? dateTime.format(new Date(row.last_login)) : "—"),
    },
    {
      id: "actions",
      header: "Ações",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => {
        if (!canManage) return null;
        const isSelf = row.id === currentUserId;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Ações para ${row.name || row.email}`}
              >
                <MoreHorizontal aria-hidden="true" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                {row.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onEdit(row)}>
                <Pencil aria-hidden="true" className="size-4" />
                Editar dados
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isSelf || Boolean(row.deleted_at)}
                onSelect={() => onToggleStatus(row)}
              >
                {row.status === "ACTIVE" ? (
                  <UserX aria-hidden="true" className="size-4" />
                ) : (
                  <UserCheck aria-hidden="true" className="size-4" />
                )}
                {row.status === "ACTIVE" ? "Desativar conta" : "Ativar conta"}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isSelf} onSelect={() => onChangeRole(row)}>
                <ShieldCheck aria-hidden="true" className="size-4" />
                Alterar papel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.deleted_at ? (
                <DropdownMenuItem onSelect={() => onRestore(row)}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Restaurar conta
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled={isSelf}
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setPendingDelete(row)}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Excluir conta
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        caption="Usuários da plataforma"
        emptyTitle="Nenhum usuário encontrado"
        emptyDescription="Ajuste a busca ou os filtros de papel e status."
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={onSortChange}
        {...(isLoading !== undefined ? { isLoading } : {})}
        {...(isError !== undefined ? { isError } : {})}
        {...(onRetry ? { onRetry } : {})}
      />

      <ConfirmDelete
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Excluir conta"
        description={`A conta de ${pendingDelete?.name || pendingDelete?.email || ""} será desativada e mantida no histórico para fins de auditoria.`}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
