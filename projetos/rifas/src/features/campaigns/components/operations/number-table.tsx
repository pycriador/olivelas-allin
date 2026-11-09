import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

import type { EnrichedNumber } from "./number-types";
import { CAMPAIGN_NUMBER_STATUS_LABELS } from "@/types/campaign-number";
import { STATUS_BADGE_CLASSES } from "./status-constants";

export interface NumberTableProps {
  rows: EnrichedNumber[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSelectNumber: (number: EnrichedNumber) => void;
  onViewOrder?: (orderId: string) => void;
  onViewCustomer?: (customerId: string) => void;
}

const STATUS_FILTERS = [
  "ALL",
  "AVAILABLE",
  "RESERVED",
  "PENDING_PAYMENT",
  "PAID",
  "BLOCKED",
  "CANCELLED",
  "WINNER",
] as const;
const SOURCE_FILTERS = ["ALL", "MANUAL", "WHATSAPP", "ONLINE"] as const;

export function NumberTable({
  rows,
  isLoading,
  isError,
  onRetry,
  onSelectNumber,
  onViewOrder,
  onViewCustomer,
}: NumberTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const filtered = useMemo(() => {
    let result = rows;

    if (statusFilter !== "ALL") {
      result = result.filter((row) => row.status === statusFilter);
    }
    if (sourceFilter !== "ALL") {
      result = result.filter((row) => row.orderSource === sourceFilter);
    }

    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter((row) => {
        if (String(row.number).includes(term)) return true;
        if (row.customerName?.toLowerCase().includes(term)) return true;
        if (row.customerPhone?.includes(term)) return true;
        if (row.orderId?.toLowerCase().includes(term)) return true;
        if (row.orderSource?.toLowerCase().includes(term)) return true;
        if (row.paymentMethod?.toLowerCase().includes(term)) return true;
        return false;
      });
    }

    return result;
  }, [rows, search, statusFilter, sourceFilter]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: DataTableColumn<EnrichedNumber>[] = [
    {
      id: "number",
      header: "Número",
      cell: (row) => (
        <button
          type="button"
          className="text-left font-semibold tabular-nums text-primary hover:underline"
          onClick={() => onSelectNumber(row)}
        >
          {row.number}
        </button>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <NumberStatusBadge status={row.status} />,
    },
    {
      id: "customer",
      header: "Cliente",
      cell: (row) =>
        row.customerName ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.customerName}</p>
            {row.customerPhone ? (
              <p className="truncate text-xs text-muted-foreground">{row.customerPhone}</p>
            ) : null}
            {onViewCustomer && row.customerId ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => onViewCustomer(row.customerId!)}
              >
                Ver cliente
              </Button>
            ) : null}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "order",
      header: "Pedido",
      cell: (row) =>
        row.orderId ? (
          <div className="min-w-0">
            <button
              type="button"
              className="font-mono text-xs text-primary hover:underline"
              onClick={() => onViewOrder?.(row.orderId!)}
            >
              #{row.orderId.slice(0, 8)}
            </button>
            {row.orderSource ? (
              <p className="text-xs text-muted-foreground">{row.orderSource}</p>
            ) : null}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "payment",
      header: "Pagamento",
      cell: (row) =>
        row.paymentMethod ? (
          <Badge variant="outline">{row.paymentMethod}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "updated",
      header: "Atualizado",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.updatedAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            aria-hidden="true"
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar número, nome, pedido..."
            className="pl-8"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            {STATUS_FILTERS.filter((s) => s !== "ALL").map((s) => (
              <SelectItem key={s} value={s}>
                {CAMPAIGN_NUMBER_STATUS_LABELS[s as keyof typeof CAMPAIGN_NUMBER_STATUS_LABELS] ??
                  s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sourceFilter}
          onValueChange={(value) => {
            setSourceFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as origens</SelectItem>
            {SOURCE_FILTERS.filter((s) => s !== "ALL").map((s) => (
              <SelectItem key={s} value={s}>
                {s === "MANUAL" ? "Manual" : s === "WHATSAPP" ? "WhatsApp" : "Online"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {filtered.length} número{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={paged}
        rowKey={(row) => row.id}
        isLoading={isLoading ?? false}
        isError={isError ?? false}
        {...(onRetry ? { onRetry } : {})}
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        emptyTitle="Nenhum número encontrado"
        emptyDescription="Ajuste os filtros ou verifique se a campanha possui números registrados."
        caption="Números da campanha"
      />
    </div>
  );
}

function NumberStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_BADGE_CLASSES[status] ?? "text-muted-foreground"}>{status}</Badge>
  );
}
