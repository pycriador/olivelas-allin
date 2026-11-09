import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { AUDIT_ACTION_LABELS, type AuditLogWithActor } from "@/types/audit";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" });

function summarize(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    const text = JSON.stringify(value);
    return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  }
  return String(value);
}

interface AuditTableProps {
  rows: AuditLogWithActor[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AuditTable({
  rows,
  isLoading,
  isError,
  onRetry,
  page,
  pageSize,
  total,
  onPageChange,
}: AuditTableProps) {
  const columns: DataTableColumn<AuditLogWithActor>[] = [
    {
      id: "created_at",
      header: "Data",
      className: "whitespace-nowrap text-xs text-muted-foreground",
      cell: (row) => dateTime.format(new Date(row.created_at)),
    },
    {
      id: "action",
      header: "Ação",
      cell: (row) => (
        <Badge variant="secondary">
          {AUDIT_ACTION_LABELS[row.action as keyof typeof AUDIT_ACTION_LABELS] ?? row.action}
        </Badge>
      ),
    },
    {
      id: "actor",
      header: "Usuário",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{row.actor_name ?? "Sistema"}</p>
          <p className="truncate text-xs text-muted-foreground">{row.actor_email ?? "—"}</p>
        </div>
      ),
    },
    { id: "entity", header: "Entidade", cell: (row) => row.entity ?? "—" },
    {
      id: "entity_id",
      header: "Referência",
      className: "max-w-48 truncate text-xs text-muted-foreground",
      cell: (row) => row.entity_id ?? "—",
    },
    {
      id: "new_value",
      header: "Alteração",
      className: "max-w-64 truncate text-xs text-muted-foreground",
      cell: (row) => summarize(row.new_value),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      caption="Registros de auditoria"
      emptyTitle="Nenhum registro de auditoria"
      emptyDescription="Ajuste os filtros de período, usuário ou ação."
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      {...(isLoading !== undefined ? { isLoading } : {})}
      {...(isError !== undefined ? { isError } : {})}
      {...(onRetry ? { onRetry } : {})}
    />
  );
}
