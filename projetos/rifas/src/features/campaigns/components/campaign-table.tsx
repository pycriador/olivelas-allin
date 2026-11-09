import { Link } from "@tanstack/react-router";
import { Archive, Copy, ImageOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";
import { campaignMediaPublicUrl } from "@/services/campaign.service";
import { formatCurrency, formatDate, formatNumberRange } from "@/lib/format";
import {
  CAMPAIGN_STATUS_TRANSITIONS,
  CAMPAIGN_VISIBILITY_LABELS,
  type CampaignWithRelations,
} from "@/types/campaign";

export interface CampaignTableProps {
  rows: CampaignWithRelations[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onDuplicate?: (campaign: CampaignWithRelations) => void;
  onArchive?: (campaign: CampaignWithRelations) => void;
  onDelete?: (campaign: CampaignWithRelations) => void;
}

export function CampaignTable({
  rows,
  isLoading = false,
  isError = false,
  onRetry,
  page,
  pageSize,
  total,
  onPageChange,
  onDuplicate,
  onArchive,
  onDelete,
}: CampaignTableProps) {
  const columns: DataTableColumn<CampaignWithRelations>[] = [
    {
      id: "cover",
      header: "",
      className: "w-12",
      cell: (row) => {
        const url = campaignMediaPublicUrl(row.cover_image);
        return url ? (
          <img
            src={url}
            alt=""
            loading="lazy"
            className="size-10 rounded-md border border-border object-cover"
          />
        ) : (
          <span className="flex size-10 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
            <ImageOff aria-hidden="true" className="size-4" />
          </span>
        );
      },
    },
    {
      id: "title",
      header: "Campanha",
      cell: (row) => (
        <div className="min-w-0">
          <Link
            to="/campanhas/$campanhaId"
            params={{ campanhaId: row.id }}
            className="block max-w-56 truncate text-sm font-medium hover:underline"
          >
            {row.title}
          </Link>
          <p className="truncate text-xs text-muted-foreground">/{row.slug}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <CampaignStatusBadge status={row.status} />,
    },
    {
      id: "visibility",
      header: "Visibilidade",
      cell: (row) => <Badge variant="outline">{CAMPAIGN_VISIBILITY_LABELS[row.visibility]}</Badge>,
    },
    {
      id: "numbers",
      header: "Números",
      cell: (row) => (
        <span className="text-sm tabular-nums">
          {formatNumberRange(row.number_start, row.number_end)}
        </span>
      ),
    },
    {
      id: "price",
      header: "Preço",
      cell: (row) => (
        <span className="text-sm font-medium">{formatCurrency(row.price_per_number)}</span>
      ),
    },
    {
      id: "end_date",
      header: "Encerra",
      cell: (row) => <span className="text-sm">{formatDate(row.end_date)}</span>,
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) => {
        const canArchive = CAMPAIGN_STATUS_TRANSITIONS[row.status].includes("ARCHIVED");
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Ações de ${row.title}`}>
                <MoreHorizontal aria-hidden="true" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/campanhas/$campanhaId" params={{ campanhaId: row.id }}>
                  Ver detalhes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/campanhas/$campanhaId/editar" params={{ campanhaId: row.id }}>
                  <Pencil aria-hidden="true" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onDuplicate ? (
                <DropdownMenuItem onClick={() => onDuplicate(row)}>
                  <Copy aria-hidden="true" />
                  Duplicar
                </DropdownMenuItem>
              ) : null}
              {canArchive && onArchive ? (
                <DropdownMenuItem onClick={() => onArchive(row)}>
                  <Archive aria-hidden="true" />
                  Arquivar
                </DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(row)}
                >
                  <Trash2 aria-hidden="true" />
                  Excluir
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
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
      emptyTitle="Nenhuma campanha encontrada"
      emptyDescription="Crie sua primeira campanha ou ajuste os filtros."
      caption="Lista de campanhas"
    />
  );
}
