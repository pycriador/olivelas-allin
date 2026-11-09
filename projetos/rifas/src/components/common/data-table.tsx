import { useMemo, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/status-states";
import { cn } from "@/lib/utils";

export interface DataTableColumn<TRow> {
  id: string;
  header: string;
  cell: (row: TRow) => ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<TRow> {
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  rowKey: (row: TRow) => string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (columnId: string) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  caption?: string;
}

export function DataTable<TRow>({
  columns,
  rows,
  rowKey,
  isLoading,
  isError,
  onRetry,
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription = "Ajuste os filtros ou tente outra pesquisa.",
  sortBy,
  sortDir = "asc",
  onSortChange,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  caption,
}: DataTableProps<TRow>) {
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  if (isError) return <ErrorState {...(onRetry ? { onRetry } : {})} />;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className={column.headerClassName}>
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(column.id)}
                      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                      aria-label={`Ordenar por ${column.header}`}
                    >
                      {column.header}
                      {sortBy === column.id ? (
                        sortDir === "asc" ? (
                          <ArrowUp aria-hidden="true" className="size-3" />
                        ) : (
                          <ArrowDown aria-hidden="true" className="size-3" />
                        )
                      ) : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    {columns.map((column) => (
                      <TableCell key={column.id}>
                        <Skeleton className="h-5 w-full max-w-40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow key={rowKey(row)}>
                    {columns.map((column) => (
                      <TableCell key={column.id} className={cn("align-middle", column.className)}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : null}

      {onPageChange ? (
        <nav
          aria-label="Paginação"
          className="flex flex-col items-center justify-between gap-3 sm:flex-row"
        >
          <p className="text-xs text-muted-foreground">
            {total} registro{total === 1 ? "" : "s"} · página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
            >
              Próxima
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
