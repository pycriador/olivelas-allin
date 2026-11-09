import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Archive, LayoutGrid, Plus, Rows3, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { BarChartCard } from "@/features/dashboard/components/chart-cards";
import { CampaignCard } from "@/features/campaigns/components/campaign-card";
import { CampaignTable } from "@/features/campaigns/components/campaign-table";
import {
  useCampaignMetrics,
  useCampaigns,
  useDeletedCampaigns,
  useDeleteCampaign,
  useDuplicateCampaign,
  useEmptyTrash,
  useRestoreCampaign,
  useUpdateCampaignStatus,
} from "@/features/campaigns/hooks/use-campaigns";
import { useOrderMetrics } from "@/features/orders/hooks/use-orders";
import { useAuth } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { formatMonthLabel } from "@/lib/format";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_VISIBILITY_LABELS,
  type CampaignStatus,
  type CampaignVisibility,
  type CampaignWithRelations,
} from "@/types/campaign";

export const Route = createFileRoute("/_authenticated/campanhas/")({
  head: () => ({
    meta: [
      { title: "Campanhas — RaffleHub" },
      { name: "description", content: "Gerencie suas campanhas de rifas no RaffleHub." },
      { property: "og:title", content: "Campanhas — RaffleHub" },
      { property: "og:description", content: "Gerencie suas campanhas de rifas no RaffleHub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CampaignsRoute,
});

const PAGE_SIZE = 5;

function CampaignsRoute() {
  return (
    <PermissionGuard permission="campaigns.view">
      <CampaignsPage />
    </PermissionGuard>
  );
}

function CampaignsPage() {
  const { user, isGlobalAdmin, role } = useAuth();
  const { can } = usePermissions();
  const isAdmin = isGlobalAdmin || role === "ADMIN";
  const createdBy = isAdmin ? undefined : (user?.id ?? undefined);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialPage = Number(params.get("page")) || 1;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "ALL">("ALL");
  const [visibility, setVisibility] = useState<CampaignVisibility | "ALL">("ALL");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(initialPage);
  const [duplicateTarget, setDuplicateTarget] = useState<CampaignWithRelations | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CampaignWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignWithRelations | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);

  const filters = useMemo(
    () => ({
      status,
      visibility,
      ...(search ? { search } : {}),
      ...(createdBy ? { createdBy } : {}),
    }),
    [search, status, visibility, createdBy],
  );

  const query = useCampaigns({ page, pageSize: PAGE_SIZE, filters });
  const metrics = useCampaignMetrics(createdBy);
  const orderMetrics = useOrderMetrics(createdBy).data;
  const soldCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of orderMetrics?.byCampaign ?? []) {
      map.set(item.campaign_id, item.paid);
    }
    return map;
  }, [orderMetrics]);
  const deleted = useDeletedCampaigns(createdBy);
  const duplicate = useDuplicateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const updateStatus = useUpdateCampaignStatus();
  const restore = useRestoreCampaign();
  const emptyTrash = useEmptyTrash();

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE));

  function goToPage(newPage: number) {
    setPage(newPage);
    const url = new URL(window.location.href);
    if (newPage > 1) {
      url.searchParams.set("page", String(newPage));
    } else {
      url.searchParams.delete("page");
    }
    window.history.replaceState(null, "", url.toString());
  }

  const chartData = useMemo(
    () =>
      (metrics.data?.byMonth ?? []).map((item) => ({
        label: formatMonthLabel(item.month),
        value: item.count,
      })),
    [metrics.data],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campanhas"
        description="Crie, publique e acompanhe suas rifas digitais."
        actions={
          <>
            <Button variant="outline" onClick={() => setTrashOpen(true)}>
              <Trash2 aria-hidden="true" className="size-4" />
              Lixeira
              {deleted.data && deleted.data.length > 0 ? (
                <Badge variant="secondary" className="ml-1">
                  {deleted.data.length}
                </Badge>
              ) : null}
            </Button>
            {can("campaigns.manage") ? (
              <Button asChild>
                <Link to="/campanhas/nova">
                  <Plus aria-hidden="true" className="size-4" />
                  Nova campanha
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <section
        aria-label="Resumo de campanhas"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard title="Total" value={String(metrics.data?.total ?? 0)} icon={LayoutGrid} />
        <StatCard title="Ativas" value={String(metrics.data?.active ?? 0)} icon={Archive} />
        <StatCard title="Agendadas" value={String(metrics.data?.scheduled ?? 0)} icon={Archive} />
        <StatCard title="Finalizadas" value={String(metrics.data?.finished ?? 0)} icon={Archive} />
      </section>

      <section aria-label="Filtros" className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Buscar campanha…"
          aria-label="Buscar campanhas"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as typeof status);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {(Object.keys(CAMPAIGN_STATUS_LABELS) as CampaignStatus[]).map((item) => (
                <SelectItem key={item} value={item}>
                  {CAMPAIGN_STATUS_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={visibility}
            onValueChange={(value) => {
              setVisibility(value as typeof visibility);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40" aria-label="Filtrar por visibilidade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Pública e privada</SelectItem>
              <SelectItem value="PUBLIC">{CAMPAIGN_VISIBILITY_LABELS.PUBLIC}</SelectItem>
              <SelectItem value="PRIVATE">{CAMPAIGN_VISIBILITY_LABELS.PRIVATE}</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={view} onValueChange={(value) => setView(value as typeof view)}>
            <TabsList>
              <TabsTrigger value="grid">
                <LayoutGrid aria-hidden="true" className="size-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="table">
                <Rows3 aria-hidden="true" className="size-4" />
                Tabela
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {view === "grid" ? (
        <>
          <section aria-label="Campanhas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {query.isPending
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="surface-card aspect-[4/3] animate-pulse" />
                ))
              : query.data?.items.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    soldCount={soldCounts.get(campaign.id) ?? 0}
                  />
                ))}
          </section>

          {!query.isPending && (query.data?.items.length ?? 0) > 0 ? (
            <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {query.data?.total ?? 0} campanha(s) · página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || query.isPending}
                  onClick={() => goToPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || query.isPending}
                  onClick={() => goToPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            </nav>
          ) : null}
        </>
      ) : (
        <CampaignTable
          rows={query.data?.items ?? []}
          isLoading={query.isPending}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          page={page}
          pageSize={PAGE_SIZE}
          total={query.data?.total ?? 0}
          onPageChange={setPage}
          onDuplicate={setDuplicateTarget}
          onArchive={setArchiveTarget}
          onDelete={setDeleteTarget}
        />
      )}

      {chartData.length > 0 ? (
        <section aria-label="Campanhas por mes">
          <BarChartCard
            title="Campanhas por mes"
            description="Quantidade de campanhas criadas nos ultimos meses."
            data={chartData}
          />
        </section>
      ) : null}

      <ConfirmDialog
        open={duplicateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDuplicateTarget(null);
        }}
        title="Duplicar campanha"
        description={`Criar uma cópia de "${duplicateTarget?.title ?? ""}" em rascunho, incluindo imagens e configurações?`}
        confirmLabel="Duplicar"
        onConfirm={() => {
          if (!duplicateTarget) return;
          duplicate.mutate(duplicateTarget.id, {
            onSuccess: (created) => {
              toast.success(`Cópia de "${created.title}" criada`);
              setDuplicateTarget(null);
            },
            onError: (error) => toast.error("Falha ao duplicar", { description: error.message }),
          });
        }}
      />

      <ConfirmDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title="Arquivar campanha"
        description={`Arquivar "${archiveTarget?.title ?? ""}"? A campanha fica inativa até ser reativada.`}
        confirmLabel="Arquivar"
        onConfirm={() => {
          if (!archiveTarget) return;
          updateStatus.mutate(
            { campaignId: archiveTarget.id, status: "ARCHIVED" },
            {
              onSuccess: () => {
                toast.success(`"${archiveTarget.title}" arquivada`);
                setArchiveTarget(null);
              },
              onError: (error) => toast.error("Falha ao arquivar", { description: error.message }),
            },
          );
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Excluir campanha"
        description={`Excluir "${deleteTarget?.title ?? ""}"? Ela pode ser restaurada pela lixeira.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteCampaign.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Campanha excluída");
              setDeleteTarget(null);
            },
            onError: (error) => toast.error("Falha ao excluir", { description: error.message }),
          });
        }}
      />

      <TrashDialog
        open={trashOpen}
        onOpenChange={setTrashOpen}
        campaigns={deleted.data ?? []}
        isLoading={emptyTrash.isPending}
        onRestore={(campaign) =>
          restore.mutate(campaign.id, {
            onSuccess: () => toast.success(`"${campaign.title}" restaurada`),
            onError: (error) => toast.error("Falha ao restaurar", { description: error.message }),
          })
        }
        onEmptyTrash={() => {
          const ids = (deleted.data ?? []).map((c) => c.id);
          if (ids.length === 0) return;
          emptyTrash.mutate(ids, {
            onSuccess: () => toast.success("Lixeira esvaziada"),
            onError: (error) =>
              toast.error("Falha ao esvaziar lixeira", { description: error.message }),
          });
        }}
      />
    </div>
  );
}

function TrashDialog({
  open,
  onOpenChange,
  campaigns,
  isLoading,
  onRestore,
  onEmptyTrash,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: Array<{ id: string; title: string }>;
  isLoading?: boolean;
  onRestore: (campaign: { id: string; title: string }) => void;
  onEmptyTrash: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lixeira de campanhas</DialogTitle>
          <DialogDescription>
            Campanhas excluidas podem ser restauradas. Ao restaurar, o slug original e liberado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {campaigns.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma campanha na lixeira.
            </p>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <span className="min-w-0 truncate text-sm font-medium">{campaign.title}</span>
                <Button variant="outline" size="sm" onClick={() => onRestore(campaign)}>
                  Restaurar
                </Button>
              </div>
            ))
          )}
        </div>
        {campaigns.length > 0 ? (
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={isLoading}
            onClick={onEmptyTrash}
          >
            Esvaziar lixeira permanentemente
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
