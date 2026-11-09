import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileUp, Plus, Search, ShoppingBag } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderTable } from "@/features/orders/components/order-table";
import { OrderDetailDialog } from "@/features/orders/components/order-detail-dialog";
import { ManualSaleDialog } from "@/features/orders/components/manual-sale-dialog";
import { ImportNumbersDialog } from "@/features/orders/components/import-numbers-dialog";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { useCampaigns } from "@/features/campaigns/hooks/use-campaigns";
import { useAuth } from "@/contexts/auth-context";
import type { OrderFilters, OrderSource, OrderStatus, OrderWithRelations } from "@/types/order";
import {
  ORDER_SOURCE_LABELS,
  ORDER_SOURCE_VALUES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VALUES,
} from "@/types/order";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos — RaffleHub" },
      {
        name: "description",
        content: "Gestão completa de vendas, reservas e pedidos no RaffleHub.",
      },
    ],
  }),
  component: PedidosPage,
});

function PedidosPage() {
  const { user, isGlobalAdmin, role } = useAuth();
  const isAdmin = isGlobalAdmin || role === "ADMIN";
  const createdBy = isAdmin ? undefined : (user?.id ?? undefined);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [filters, setFilters] = useState<OrderFilters>({
    status: "ALL",
    source: "ALL",
    search: "",
    ...(createdBy ? { createdBy } : {}),
  });

  const [detailOrder, setDetailOrder] = useState<OrderWithRelations | null>(null);
  const [manualSaleOpen, setManualSaleOpen] = useState(false);
  const [importNumbersOpen, setImportNumbersOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  const campaigns = useCampaigns({
    page: 1,
    pageSize: 100,
    ...(createdBy ? { filters: { createdBy } } : {}),
  });
  const campaignList = campaigns.data?.items ?? [];
  const activeCampaign = campaignList.find((c) => c.id === selectedCampaignId) ?? campaignList[0];

  const { data, isLoading, isError, refetch } = useOrders({
    page,
    pageSize,
    filters,
  });

  return (
    <PermissionGuard permission="orders.view">
      <div className="space-y-6">
        <PageHeader
          title="Pedidos"
          description="Acompanhe vendas manuais, reservas via WhatsApp e compras da plataforma."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedCampaignId || ""} onValueChange={setSelectedCampaignId}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Selecionar campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaignList.map((cmp) => (
                    <SelectItem key={cmp.id} value={cmp.id}>
                      {cmp.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setImportNumbersOpen(true)}
                disabled={!selectedCampaignId}
              >
                <FileUp className="size-4" />
                Importar números
              </Button>
              <Button onClick={() => setManualSaleOpen(true)} disabled={!selectedCampaignId}>
                <Plus className="size-4" />
                Nova venda manual
              </Button>
            </div>
          }
        />

        {/* Barra de Filtros */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, telefone..."
              value={filters.search ?? ""}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }));
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={filters.status ?? "ALL"}
            onValueChange={(val) => {
              setFilters((prev) => ({ ...prev, status: val as OrderStatus | "ALL" }));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {ORDER_STATUS_VALUES.map((st) => (
                <SelectItem key={st} value={st}>
                  {ORDER_STATUS_LABELS[st]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.source ?? "ALL"}
            onValueChange={(val) => {
              setFilters((prev) => ({ ...prev, source: val as OrderSource | "ALL" }));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as origens</SelectItem>
              {ORDER_SOURCE_VALUES.map((src) => (
                <SelectItem key={src} value={src}>
                  {ORDER_SOURCE_LABELS[src]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.campaignId ?? "ALL"}
            onValueChange={(val) => {
              const campaignId = val === "ALL" ? undefined : val;
              setFilters((prev) => ({ ...prev, campaignId }) as OrderFilters);
              if (campaignId) setSelectedCampaignId(campaignId);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Campanha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as campanhas</SelectItem>
              {campaignList.map((cmp) => (
                <SelectItem key={cmp.id} value={cmp.id}>
                  {cmp.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filters.status !== "ALL" ||
          filters.source !== "ALL" ||
          filters.campaignId ||
          filters.search ? (
            <Button
              variant="ghost"
              onClick={() => {
                setFilters({ status: "ALL", source: "ALL", search: "" });
                setPage(1);
              }}
            >
              Limpar filtros
            </Button>
          ) : null}
        </div>

        {/* Tabela de Pedidos */}
        <OrderTable
          rows={data?.items ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          page={page}
          pageSize={pageSize}
          total={data?.total ?? 0}
          onPageChange={setPage}
          onView={(order) => setDetailOrder(order)}
        />

        {/* Detalhes do Pedido */}
        {detailOrder ? (
          <OrderDetailDialog
            order={detailOrder}
            campaign={activeCampaign ?? null}
            open={Boolean(detailOrder)}
            onOpenChange={(open) => !open && setDetailOrder(null)}
          />
        ) : null}

        {/* Modal Venda Manual */}
        {activeCampaign && manualSaleOpen ? (
          <ManualSaleDialog
            campaign={activeCampaign}
            open={manualSaleOpen}
            onOpenChange={setManualSaleOpen}
          />
        ) : null}

        {/* Modal Importar Números */}
        {activeCampaign && importNumbersOpen ? (
          <ImportNumbersDialog
            campaign={activeCampaign}
            open={importNumbersOpen}
            onOpenChange={setImportNumbersOpen}
          />
        ) : null}
      </div>
    </PermissionGuard>
  );
}
