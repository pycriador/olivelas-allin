import { Eye, MoreHorizontal } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { OrderSourceBadge } from "@/features/orders/components/order-source-badge";
import type { OrderWithRelations } from "@/types/order";
import { formatCurrency, formatDateTime } from "@/lib/format";

export interface OrderTableProps {
  rows: OrderWithRelations[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onView?: (order: OrderWithRelations) => void;
}

export function OrderTable({
  rows,
  isLoading = false,
  isError = false,
  onRetry,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
}: OrderTableProps) {
  const columns: DataTableColumn<OrderWithRelations>[] = [
    {
      id: "code",
      header: "Pedido",
      cell: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>,
    },
    {
      id: "customer",
      header: "Cliente",
      cell: (row) => (
        <span className="block max-w-48 truncate text-sm font-medium">
          {row.customer?.full_name ?? "Consumidor final"}
        </span>
      ),
    },
    {
      id: "source",
      header: "Origem",
      cell: (row) => <OrderSourceBadge source={row.source} />,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      id: "payment",
      header: "Pagamento",
      cell: (row) =>
        row.payment_method ? (
          <Badge variant="outline">{row.payment_method}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "numbers",
      header: "Números",
      cell: (row) => <span className="text-sm tabular-nums">{row.items.length}</span>,
    },
    {
      id: "total",
      header: "Total",
      cell: (row) => (
        <span className="text-sm font-semibold tabular-nums">{formatCurrency(row.total)}</span>
      ),
    },
    {
      id: "created_at",
      header: "Criado em",
      cell: (row) => <span className="text-xs">{formatDateTime(row.created_at)}</span>,
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Ações do pedido ${row.id}`}>
              <MoreHorizontal aria-hidden="true" className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView ? (
              <DropdownMenuItem onClick={() => onView(row)}>
                <Eye aria-hidden="true" />
                Ver detalhes
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      isLoading={isLoading}
      isError={isError}
      {...(onRetry ? { onRetry } : {})}
      {...(page !== undefined ? { page } : {})}
      {...(pageSize !== undefined ? { pageSize } : {})}
      {...(total !== undefined ? { total } : {})}
      {...(onPageChange ? { onPageChange } : {})}
      emptyTitle="Nenhum pedido encontrado"
      emptyDescription="Crie sua primeira venda ou ajuste os filtros."
      caption="Lista de pedidos"
    />
  );
}
