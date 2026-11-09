import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileUp,
  MessageCircle,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Share2,
  Trash2,
  Trophy,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import { useAuth } from "@/contexts/auth-context";

function getTabFromURL(): string {
  if (typeof window === "undefined") return "overview";
  const t = new URLSearchParams(window.location.search).get("tab");
  const valid = [
    "overview",
    "grid",
    "numbers",
    "orders",
    "crm",
    "participants",
    "gallery",
    "artwork",
    "settings",
    "contact",
    "reservations",
    "draw",
    "history",
  ];
  return t && valid.includes(t) ? t : "overview";
}

import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ActivityTimeline } from "@/components/common/activity-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignMediaManager } from "@/features/campaigns/components/operations/campaign-media-manager";
import { ArtworkGenerator } from "@/features/campaigns/components/operations/artwork-generator";
import { CampaignSettings } from "@/features/campaigns/components/campaign-settings";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";
import { ShareDialog } from "@/features/campaigns/components/share-dialog";
import { NumberSelectionSection } from "@/features/campaigns/components/numbers/number-selection-section";
import { CampaignOverviewTab } from "@/features/campaigns/components/operations/campaign-overview-tab";
import { NumberTable } from "@/features/campaigns/components/operations/number-table";
import { NumberDrawer } from "@/features/campaigns/components/operations/number-drawer";
import type { EnrichedNumber } from "@/features/campaigns/components/operations/number-types";
import { useNow } from "@/features/campaigns/hooks/use-countdown";
import {
  useRealtimeCampaign,
  buildNumberStateMap,
  resolveNumberStatus,
} from "@/features/campaigns/hooks/use-realtime-campaign";
import { useReservation } from "@/features/campaigns/hooks/use-reservation";
import { useCampaignNumbersEnriched } from "@/features/campaigns/hooks/use-campaign-numbers-enriched";
import { OrderTable } from "@/features/orders/components/order-table";
import { OrderDetailDialog } from "@/features/orders/components/order-detail-dialog";
import { ManualSaleDialog } from "@/features/orders/components/manual-sale-dialog";
import { ImportNumbersDialog } from "@/features/orders/components/import-numbers-dialog";
import {
  useOrders,
  useOrderMetrics,
  useRealtimeOrders,
  useDeleteOrder,
} from "@/features/orders/hooks/use-orders";
import { useCustomers, useCustomer } from "@/features/customers/hooks/use-customers";
import { CustomerCard } from "@/features/customers/components/customer-card";
import {
  useCampaign,
  useDeleteCampaign,
  useDuplicateCampaign,
  useUpdateCampaignStatus,
} from "@/features/campaigns/hooks/use-campaigns";
import { auditService } from "@/services/audit.service";
import { campaignNumberService } from "@/services/campaign-number.service";
import { campaignService } from "@/services/campaign.service";
import { orderService } from "@/services/order.service";
import type { CampaignWithRelations } from "@/types/campaign";
import type { CampaignNumberStatus, NumberGridStatus } from "@/types/campaign-number";
import {
  CAMPAIGN_NUMBER_STATUS_VALUES,
  CAMPAIGN_NUMBER_STATUS_LABELS,
} from "@/types/campaign-number";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_TRANSITIONS,
} from "@/types/campaign";
import type { OrderWithRelations } from "@/types/order";
import type { CustomerWithStats } from "@/types/customer";
import { formatCurrency } from "@/lib/format";
import { downloadData } from "@/lib/download";
import {
  loadDrawView,
  performCampaignDraw,
  resetCampaignDraw,
  MAX_DRAW_PER_PUBLISHER,
  type DrawResult,
} from "@/lib/draw.service";
import {
  useCampaignParticipants,
  ORIGIN_LABELS,
  type CampaignParticipant,
} from "@/features/campaigns/hooks/use-campaign-participants";
import { maskEmail, maskPhone } from "@/lib/mask";

export const Route = createFileRoute("/_authenticated/campanhas/$campanhaId/")({
  head: () => ({
    meta: [
      { title: "Centro de Operação — RaffleHub" },
      { name: "description", content: "Centro operacional da campanha no RaffleHub." },
      { property: "og:title", content: "Centro de Operação — RaffleHub" },
      { property: "og:description", content: "Centro operacional da campanha no RaffleHub." },
    ],
  }),
  component: CampaignDetailRoute,
});

function CampaignDetailRoute() {
  const { campanhaId } = useParams({ from: "/_authenticated/campanhas/$campanhaId/" });
  const navigate = useNavigate();
  const [tab, setTab] = useState(() => getTabFromURL());
  const [shareOpen, setShareOpen] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(false);

  const campaign = useCampaign(campanhaId);
  const updateStatus = useUpdateCampaignStatus();
  const duplicate = useDuplicateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const audit = useQuery({
    queryKey: ["audit", "campaign", campanhaId],
    queryFn: () => auditService.listForEntity("campaign", campanhaId),
    enabled: Boolean(campanhaId),
  });

  if (campaign.isPending) return <LoadingState label="Carregando campanha…" />;

  if (!campaign.data) {
    return (
      <EmptyState
        title="Campanha não encontrada"
        description="Ela pode ter sido removida ou o link está incorreto."
        actions={
          <Button asChild variant="outline">
            <Link to="/campanhas">Voltar para campanhas</Link>
          </Button>
        }
      />
    );
  }

  const data = campaign.data;
  const nextStatuses = CAMPAIGN_STATUS_TRANSITIONS[data.status];
  const canShare = data.visibility === "PUBLIC" && (data.settings?.enable_public_page ?? true);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground">
          <Link to="/campanhas">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Campanhas
          </Link>
        </Button>
        <PageHeader
          title={`Centro de Operacao: ${data.title}`}
          {...(data.short_description ? { description: data.short_description } : {})}
        />
      </div>

      {nextStatuses.length > 0 ? (
        <section
          aria-label="Mudanca de status"
          className="surface-card flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
        >
          <CampaignStatusBadge status={data.status} />
          <Select
            value=""
            onValueChange={(next) => {
              updateStatus.mutate(
                { campaignId: data.id, status: next as typeof data.status },
                {
                  onSuccess: () =>
                    toast.success(
                      `Status alterado para ${CAMPAIGN_STATUS_LABELS[next as typeof data.status]}`,
                    ),
                  onError: (error) =>
                    toast.error("Falha ao alterar status", { description: error.message }),
                },
              );
            }}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Transicoes de status disponiveis">
              <SelectValue placeholder="Selecionar proximo status..." />
            </SelectTrigger>
            <SelectContent>
              {nextStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {CAMPAIGN_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {canShare ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
                  <Share2 aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">Compartilhar</span>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/r/${data.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink aria-hidden="true" className="size-4" />
                    <span className="hidden sm:inline">Ver publica</span>
                  </a>
                </Button>
              </>
            ) : null}
            <Button asChild size="sm">
              <Link to="/campanhas/$campanhaId/editar" params={{ campanhaId: data.id }}>
                Editar
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDuplicateTarget(true)}>
              <Copy aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Duplicar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setArchiveTarget(true)}>
              <Archive aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Arquivar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setDeleteTarget(true)}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
          </div>
        </section>
      ) : null}

      <div className="pt-4">
        {tab === "overview" ? <CampaignOverviewTab campaign={data} /> : null}
        {tab === "grid" ? <CampaignGridOperationTab campaign={data} /> : null}
        {tab === "numbers" ? <CampaignNumbersTab campaign={data} /> : null}
        {tab === "orders" ? <CampaignOrdersTab campaign={data} /> : null}
        {tab === "crm" ? (
          <CampaignCustomersTab campaignId={data.id} campaignSlug={data.slug} />
        ) : null}
        {tab === "gallery" ? (
          <CampaignMediaManager campaignId={data.id} images={data.images} />
        ) : null}
        {tab === "artwork" ? <ArtworkGenerator campaign={data} /> : null}
        {tab === "settings" ? (
          <div className="surface-card p-6">
            <CampaignSettings
              campaignId={data.id}
              settings={data.settings}
              images={data.images}
              campaign={data}
            />
          </div>
        ) : null}
        {tab === "contact" ? (
          <div className="surface-card p-6">
            <CampaignContactSettings campaign={data} />
          </div>
        ) : null}
        {tab === "history" ? (
          <div className="surface-card p-6">
            <ActivityTimeline items={audit.data ?? []} isLoading={audit.isPending} />
          </div>
        ) : null}
        {tab === "reservations" ? <CampaignReservationsTab campaign={data} /> : null}
        {tab === "draw" ? <CampaignDrawTab campaign={data} /> : null}
        {tab === "participants" ? <CampaignParticipantsTab campaign={data} /> : null}
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        campaign={{ slug: data.slug, title: data.title }}
      />

      <ConfirmDialog
        open={duplicateTarget}
        onOpenChange={setDuplicateTarget}
        title="Duplicar campanha"
        description={`Criar uma cópia em rascunho de "${data.title}"?`}
        confirmLabel="Duplicar"
        onConfirm={() =>
          duplicate.mutate(data.id, {
            onSuccess: () => {
              toast.success("Campanha duplicada");
              setDuplicateTarget(false);
            },
            onError: (error) => toast.error("Falha ao duplicar", { description: error.message }),
          })
        }
      />

      <ConfirmDialog
        open={archiveTarget}
        onOpenChange={setArchiveTarget}
        title="Arquivar campanha"
        description={`Arquivar "${data.title}"?`}
        confirmLabel="Arquivar"
        onConfirm={() =>
          updateStatus.mutate(
            { campaignId: data.id, status: "ARCHIVED" },
            {
              onSuccess: () => {
                toast.success("Campanha arquivada");
                setArchiveTarget(false);
              },
              onError: (error) => toast.error("Falha ao arquivar", { description: error.message }),
            },
          )
        }
      />

      <ConfirmDialog
        open={deleteTarget}
        onOpenChange={setDeleteTarget}
        title="Excluir campanha"
        description={`Excluir "${data.title}"? Ela pode ser restaurada pela lixeira.`}
        confirmLabel="Excluir"
        onConfirm={() =>
          deleteCampaign.mutate(data.id, {
            onSuccess: () => {
              toast.success("Campanha excluída");
              void navigate({ to: "/campanhas" });
            },
            onError: (error) => toast.error("Falha ao excluir", { description: error.message }),
          })
        }
      />
    </div>
  );
}

function CampaignGridOperationTab({ campaign }: { campaign: CampaignWithRelations }) {
  const [manualSaleOpen, setManualSaleOpen] = useState(false);
  const [importNumbersOpen, setImportNumbersOpen] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [manualSaleDefaultStatus, setManualSaleDefaultStatus] = useState<
    "RESERVED" | "PAID" | "PENDING_PAYMENT"
  >("RESERVED");
  const [contextTarget, setContextTarget] = useState<number | null>(null);
  const [editNumbersOpen, setEditNumbersOpen] = useState(false);

  const numbersQuery = useRealtimeCampaign(campaign.id);
  const numbers = numbersQuery.data ?? [];
  const now = useNow();
  const queryClient = useQueryClient();

  const { enrichedNumbers } = useCampaignNumbersEnriched(campaign, now);

  const manageMutation = useMutation({
    mutationFn: (input: { number: number; status: CampaignNumberStatus }) =>
      campaignNumberService.manageNumberStatus(campaign.id, input.number, input.status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaign-numbers", campaign.id] });
      toast.success("Status do numero alterado");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Falha"),
  });

  const reservation = useReservation({
    campaignId: campaign.id,
    campaign,
    numbers,
    now,
  });

  const stateMap = useMemo(() => buildNumberStateMap(numbers), [numbers]);

  function getNumberStatus(number: number): NumberGridStatus {
    return resolveNumberStatus(stateMap.get(number) ?? null, now);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div>
          <h3 className="text-base font-semibold">Painel da Grade Visual</h3>
          <p className="text-xs text-muted-foreground">
            Clique duas vezes para selecionar. Clique direito ou toque longo para editar o status.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setEditNumbersOpen(true)}>
            <Pencil className="size-4" />
            Edição de números
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportNumbersOpen(true)}>
            <FileUp className="size-4" />
            Importar números
          </Button>
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              setSelectedNumbers(Array.from(reservation.selected));
              setManualSaleDefaultStatus("RESERVED");
              setManualSaleOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nova venda manual{" "}
            {reservation.selected.size > 0 ? `(${reservation.selected.size})` : ""}
          </Button>
        </div>
      </div>

      <div className="surface-card p-6">
        <NumberSelectionSection
          campaign={campaign}
          numbers={numbers}
          now={now}
          selected={reservation.selected}
          totalValue={reservation.totalValue}
          onToggle={reservation.toggle}
          onSelectDragRange={reservation.selectDragRange}
          onPick={reservation.select}
          selectionDisabled={false}
          onOpenCart={() => {
            setSelectedNumbers(Array.from(reservation.selected));
            setManualSaleDefaultStatus("RESERVED");
            setManualSaleOpen(true);
          }}
          onDoubleClick={(number) => {
            reservation.toggle(number);
          }}
          onContextMenu={(event, number) => {
            event.preventDefault();
            setContextTarget(number);
          }}
          onLongPress={(number) => setContextTarget(number)}
          primaryActionLabel="Abrir venda manual"
          hint="Toque duas vezes em um número livre para selecioná-lo para a venda manual. Toque em um número ocupado para editar o status."
        />
      </div>

      {reservation.selected.size > 0 ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="destructive"
            className="shadow-lg"
            onClick={reservation.clearSelection}
          >
            <Trash2 aria-hidden="true" className="mr-2 size-4" />
            Limpar {reservation.selected.size} numero
            {reservation.selected.size === 1 ? "" : "s"}
          </Button>
        </div>
      ) : null}

      {contextTarget ? (
        <NumberContextMenu
          number={contextTarget}
          currentStatus={getNumberStatus(contextTarget)}
          enriched={enrichedNumbers.find((n) => n.number === contextTarget) ?? null}
          isPending={manageMutation.isPending}
          onAction={(status) => {
            manageMutation.mutate({ number: contextTarget, status });
            setContextTarget(null);
          }}
          onMarkAsPaid={async () => {
            const enriched = enrichedNumbers.find((n) => n.number === contextTarget);
            if (enriched?.orderId) {
              try {
                const needsIntermediate =
                  enriched.orderStatus === "WAITING_CONTACT" || enriched.orderStatus === "OPEN";
                if (needsIntermediate) {
                  await orderService.setStatus(enriched.orderId, "WAITING_PAYMENT");
                }
                await orderService.setStatus(enriched.orderId, "PAID");
                toast.success("Pagamento confirmado no pedido");
                void queryClient.invalidateQueries({ queryKey: ["orders"] });
                void queryClient.invalidateQueries({ queryKey: ["campaign-numbers"] });
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Falha ao confirmar pagamento",
                );
              }
            } else {
              // Sem pedido: libera e abre venda manual
              try {
                await campaignNumberService.manageNumberStatus(
                  campaign.id,
                  contextTarget,
                  "AVAILABLE",
                );
              } catch {
                /* numero ja estava disponivel */
              }
              void queryClient.invalidateQueries({
                queryKey: ["campaign-numbers", campaign.id],
              });
              setSelectedNumbers([contextTarget]);
              setManualSaleDefaultStatus("PAID");
              setManualSaleOpen(true);
            }
            setContextTarget(null);
          }}
          onClose={() => setContextTarget(null)}
        />
      ) : null}

      {manualSaleOpen ? (
        <ManualSaleDialog
          campaign={campaign}
          open={manualSaleOpen}
          onOpenChange={setManualSaleOpen}
          defaultNumbers={selectedNumbers}
          defaultStatus={manualSaleDefaultStatus}
        />
      ) : null}

      {importNumbersOpen ? (
        <ImportNumbersDialog
          campaign={campaign}
          open={importNumbersOpen}
          onOpenChange={setImportNumbersOpen}
        />
      ) : null}

      {editNumbersOpen ? (
        <NumberEditDialog
          campaign={campaign}
          numbers={enrichedNumbers}
          isPending={manageMutation.isPending}
          onAction={(number, status) => {
            manageMutation.mutate({ number, status });
          }}
          onOpenChange={setEditNumbersOpen}
        />
      ) : null}
    </div>
  );
}

function NumberEditDialog({
  campaign,
  numbers,
  isPending,
  onAction,
  onOpenChange,
}: {
  campaign: CampaignWithRelations;
  numbers: EnrichedNumber[];
  isPending: boolean;
  onAction: (number: number, status: CampaignNumberStatus) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [numberInput, setNumberInput] = useState("");
  const [status, setStatus] = useState<CampaignNumberStatus>("PAID");

  const parsed = Number(numberInput);
  const current = Number.isInteger(parsed)
    ? numbers.find((n) => n.number === parsed) ?? null
    : null;
  const inRange =
    Number.isInteger(parsed) &&
    parsed >= campaign.number_start &&
    parsed <= campaign.number_end;
  const found = inRange && current;

  function handleSave() {
    if (!found) return;
    onAction(found.number, status);
    setNumberInput("");
    onOpenChange(false);
  }

  return (
    <Dialog open onOpenChange={(next) => onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5" />
            Edição de números
          </DialogTitle>
          <DialogDescription>
            Digite o número para ver o status atual e alterá-lo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-number">Número</Label>
            <Input
              id="edit-number"
              type="number"
              value={numberInput}
              onChange={(e) => setNumberInput(e.target.value)}
              placeholder={`Entre ${campaign.number_start} e ${campaign.number_end}`}
            />
          </div>

          {numberInput !== "" && !found ? (
            <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {inRange
                ? "Este número não está registrado (disponível)."
                : "Número fora do intervalo da rifa."}
            </p>
          ) : null}

          {found ? (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
              <div className="text-sm">
                <p className="font-semibold">Número {found.number}</p>
                <p className="text-muted-foreground">
                  Status atual: {CAMPAIGN_NUMBER_STATUS_LABELS[found.status]}
                </p>
                {found.customerName ? (
                  <p className="text-muted-foreground">
                    Cliente: {found.customerName}
                    {found.customerPhone ? ` · ${found.customerPhone}` : ""}
                  </p>
                ) : null}
                {found.orderId ? (
                  <p className="text-muted-foreground">
                    Pedido: #{found.orderId.slice(0, 8)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Novo status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as CampaignNumberStatus)}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_NUMBER_STATUS_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === "AVAILABLE" ? "Liberado" : CAMPAIGN_NUMBER_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={!found || isPending} onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NumberContextMenu({
  number,
  currentStatus,
  enriched,
  isPending,
  onAction,
  onMarkAsPaid,
  onClose,
}: {
  number: number;
  currentStatus: string;
  enriched: EnrichedNumber | null;
  isPending: boolean;
  onAction: (status: CampaignNumberStatus) => void;
  onMarkAsPaid: () => void;
  onClose: () => void;
}) {
  const actions = useMemo(() => {
    const list: Array<{ label: string; status?: string; onClick: () => void }> = [];
    if (currentStatus !== "PAID") {
      list.push({ label: "Marcar como Pago", onClick: onMarkAsPaid });
    }
    if (currentStatus !== "RESERVED" && currentStatus !== "AVAILABLE" && currentStatus !== "PAID") {
      list.push({
        label: "Marcar como Reservado",
        status: "RESERVED",
        onClick: () => onAction("RESERVED"),
      });
    }
    if (currentStatus !== "CANCELLED") {
      list.push({
        label: "Marcar como Cancelado",
        status: "CANCELLED",
        onClick: () => onAction("CANCELLED"),
      });
    }
    if (currentStatus === "PAID") {
      list.push({
        label: "Marcar como Premiado",
        status: "WINNER",
        onClick: () => onAction("WINNER"),
      });
    }
    if (currentStatus !== "BLOCKED") {
      list.push({
        label: "Marcar como Bloqueado",
        status: "BLOCKED",
        onClick: () => onAction("BLOCKED"),
      });
    }
    if (currentStatus !== "AVAILABLE") {
      list.push({
        label: "Liberar numero (disponivel)",
        status: "AVAILABLE",
        onClick: () => onAction("AVAILABLE"),
      });
    }
    return list;
  }, [currentStatus]);

  if (actions.length === 0) return null;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Numero {number}</DialogTitle>
          <DialogDescription>
            Status: {currentStatus}
            {enriched?.customerName ? (
              <>
                <br />
                Cliente: {enriched.customerName}
                {enriched.customerPhone ? ` · ${enriched.customerPhone}` : ""}
              </>
            ) : null}
            {enriched?.orderId ? (
              <>
                <br />
                Pedido: #{enriched.orderId.slice(0, 8)}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          {actions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="ghost"
              disabled={isPending}
              className="justify-start"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function CampaignNumbersTab({ campaign }: { campaign: CampaignWithRelations }) {
  const now = useNow();
  const { enrichedNumbers, numbersLoading, numbersError, refetchNumbers } =
    useCampaignNumbersEnriched(campaign, now);

  const [selectedNumber, setSelectedNumber] = useState<EnrichedNumber | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderWithRelations | null>(null);
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);
  const customerQuery = useCustomer(detailCustomerId ?? undefined);

  const totalNumbers = campaign.number_end - campaign.number_start + 1;

  const paidNumbers = enrichedNumbers.filter((n) => n.status === "PAID" || n.status === "WINNER");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {paidNumbers.length} numero{paidNumbers.length === 1 ? "" : "s"} pago
          {paidNumbers.length === 1 ? "" : "s"}
        </p>
        <DownloadMenu
          onDownload={(format) =>
            downloadData(
              ["Numero", "Status", "Cliente", "Telefone", "Pedido", "Origem", "Pagamento"],
              paidNumbers.map((n) => [
                String(n.number),
                n.status,
                n.customerName ?? "",
                n.customerPhone ?? "",
                n.orderId?.slice(0, 8) ?? "",
                n.orderSource ?? "",
                n.paymentMethod ?? "",
              ]),
              format,
              `numeros-${campaign.slug}`,
            )
          }
        />
      </div>
      <NumberTable
        rows={enrichedNumbers}
        isLoading={numbersLoading}
        isError={numbersError}
        onRetry={refetchNumbers}
        onSelectNumber={setSelectedNumber}
        onViewOrder={() => {
          // Will open order detail dialog if order is selected
        }}
        onViewCustomer={setDetailCustomerId}
      />

      {selectedNumber ? (
        <NumberDrawer
          number={selectedNumber}
          maxNumber={totalNumbers}
          open={Boolean(selectedNumber)}
          onOpenChange={(open) => !open && setSelectedNumber(null)}
          onViewOrder={(orderId) => {
            setSelectedNumber(null);
            // Navigate to order detail or open dialog
          }}
          onViewCustomer={(customerId) => {
            setSelectedNumber(null);
            setDetailCustomerId(customerId);
          }}
        />
      ) : null}

      {detailCustomerId && customerQuery.data ? (
        <CustomerDetailSheet
          customer={customerQuery.data}
          open={Boolean(detailCustomerId)}
          onOpenChange={(open) => !open && setDetailCustomerId(null)}
        />
      ) : null}
    </div>
  );
}

function CampaignOrdersTab({ campaign }: { campaign: CampaignWithRelations }) {
  const { user, isGlobalAdmin, role } = useAuth();
  const isAdmin = isGlobalAdmin || role === "ADMIN";
  const createdBy = isAdmin ? undefined : (user?.id ?? undefined);

  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useRealtimeOrders(campaign.id);

  const { data, isLoading, isError, refetch } = useOrders({
    page,
    pageSize: 15,
    filters: { campaignId: campaign.id },
  });

  const { data: allOrders } = useOrders({
    page: 1,
    pageSize: 5000,
    filters: { campaignId: campaign.id },
  });
  const allItems = allOrders?.items ?? [];
  const deleteOrder = useDeleteOrder();
  const orderMetrics = useOrderMetrics(createdBy).data;
  const campaignMetrics = orderMetrics?.byCampaign.find((m) => m.campaign_id === campaign.id);

  const items = data?.items ?? [];
  const totalOrders = campaignMetrics?.orders ?? 0;
  const paidCount = campaignMetrics?.paid ?? 0;
  const revenue = campaignMetrics?.revenue ?? 0;
  const avgTicket = paidCount > 0 ? revenue / paidCount : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{paidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita recebida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatCurrency(revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket medio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatCurrency(avgTicket)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {totalOrders} pedido{totalOrders === 1 ? "" : "s"}
        </h3>
        <div className="flex gap-2">
          <DownloadMenu
            onDownload={(format) =>
              downloadData(
                ["Pedido", "Cliente", "Origem", "Status", "Pagamento", "Qtd", "Total", "Data"],
                allItems.map((order) => [
                  order.id.slice(0, 8),
                  order.customer?.full_name ?? "Consumidor final",
                  order.source,
                  order.status,
                  order.payment_method ?? "",
                  String(order.items.length),
                  String(order.total),
                  order.created_at,
                ]),
                format,
                `pedidos-${campaign.slug}`,
              )
            }
          />
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            <Printer aria-hidden="true" className="size-4" />
            Imprimir
          </Button>
          {allItems.some((o) => o.status === "WAITING_CONTACT") ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setDeleteTarget("__waiting__")}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Limpar abandonados
            </Button>
          ) : null}
        </div>
      </div>

      <OrderTable
        rows={items}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        page={page}
        pageSize={15}
        total={data?.total ?? 0}
        onPageChange={setPage}
        onView={(order) => setSelectedOrder(order)}
      />

      {selectedOrder ? (
        <OrderDetailDialog
          order={selectedOrder}
          campaign={campaign}
          open={Boolean(selectedOrder)}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget === "__waiting__"}
        onOpenChange={() => setDeleteTarget(null)}
        title="Deletar pedidos abandonados"
        description="Remover todos os pedidos 'Aguardando contato' desta campanha? Os numeros serao liberados."
        confirmLabel="Deletar"
        onConfirm={() => {
          const toDelete = allItems.filter((o) => o.status === "WAITING_CONTACT");
          Promise.all(toDelete.map((o) => orderService.deleteOrder(o.id)))
            .then(() => {
              toast.success(`${toDelete.length} pedido(s) removido(s)`);
              void queryClient.invalidateQueries({ queryKey: ["orders"] });
              void queryClient.invalidateQueries({ queryKey: ["campaign-numbers"] });
            })
            .catch((error) => toast.error(error instanceof Error ? error.message : "Falha"))
            .finally(() => setDeleteTarget(null));
        }}
      />
    </div>
  );
}

function CampaignCustomersTab({
  campaignId,
  campaignSlug,
}: {
  campaignId: string;
  campaignSlug: string;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useCustomers({ page, pageSize: 12 });
  const { data: allClients } = useCustomers({ page: 1, pageSize: 5000 });
  const allClientItems = allClients?.items ?? [];

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const customerQuery = useCustomer(selectedCustomerId ?? undefined);

  if (isLoading) return <LoadingState label="Carregando clientes da campanha..." />;
  if (isError) return <p className="text-sm text-destructive">Falha ao carregar clientes.</p>;

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {items.length} cliente{items.length === 1 ? "" : "s"}
        </p>
        <DownloadMenu
          onDownload={(format) =>
            downloadData(
              ["Nome", "Telefone", "Email", "Cidade"],
              allClientItems.map((c) => [c.full_name, c.phone, c.email ?? "", c.city ?? ""]),
              format,
              `clientes-${campaignSlug}`,
            )
          }
        />
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description="Nenhum comprador foi registrado ainda para esta campanha."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((cust) => (
            <button
              key={cust.id}
              type="button"
              className="text-left"
              onClick={() => setSelectedCustomerId(cust.id)}
            >
              <CustomerCard customer={cust} />
            </button>
          ))}
        </div>
      )}

      {selectedCustomerId && customerQuery.data ? (
        <CustomerDetailSheet
          customer={customerQuery.data}
          open={Boolean(selectedCustomerId)}
          onOpenChange={(open) => !open && setSelectedCustomerId(null)}
        />
      ) : null}
    </div>
  );
}

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CustomerHistory } from "@/features/customers/components/customer-history";

function CampaignContactSettings({ campaign }: { campaign: CampaignWithRelations }) {
  const [name, setName] = useState(campaign.contact_name ?? "");
  const [phone, setPhone] = useState(campaign.contact_phone ?? "");
  const [template, setTemplate] = useState(campaign.whatsapp_message_template ?? "");
  const [mode, setMode] = useState<string>(campaign.purchase_mode ?? "MANUAL");
  const { updateCampaign } = useUpdateCampaignInline();

  function handleSave() {
    updateCampaign.mutate(
      {
        campaignId: campaign.id,
        data: {
          contact_name: name || null,
          contact_phone: phone || null,
          whatsapp_message_template: template || null,
          purchase_mode: mode as "MANUAL" | "AUTOMATIC",
        },
      },
      {
        onSuccess: () => toast.success("Dados de contato salvos"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Contato e WhatsApp</h3>
        <p className="text-sm text-muted-foreground">
          Dados usados para o fluxo de reserva via WhatsApp na pagina publica.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cs-name">Nome do contato</Label>
          <Input
            id="cs-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do organizador"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cs-phone">Telefone (WhatsApp) *</Label>
          <Input
            id="cs-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(11) 99999-9999"
          />
          {!phone ? (
            <p className="text-xs text-destructive">
              Obrigatorio para o fluxo de reserva via WhatsApp.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Modo de compra</Label>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MANUAL">Manual (WhatsApp)</SelectItem>
            <SelectItem value="AUTOMATIC">Automatico (gateway)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cs-template">Template da mensagem WhatsApp</Label>
        <Textarea
          id="cs-template"
          value={template}
          onChange={(event) => setTemplate(event.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Use {"{name}"}, {"{campaign}"}, {"{numbers}"} e {"{total}"}.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={updateCampaign.isPending}>
          {updateCampaign.isPending ? "Salvando..." : "Salvar dados de contato"}
        </Button>
      </div>
    </div>
  );
}

function useUpdateCampaignInline() {
  const queryClient = useQueryClient();
  const updateCampaign = useMutation({
    mutationFn: (input: {
      campaignId: string;
      data: {
        contact_name?: string | null;
        contact_phone?: string | null;
        whatsapp_message_template?: string | null;
        purchase_mode?: "MANUAL" | "AUTOMATIC";
      };
    }) => campaignService.updateCampaignContact(input.campaignId, input.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
  return { updateCampaign };
}

function CustomerDetailSheet({
  customer,
  open,
  onOpenChange,
}: {
  customer: CustomerWithStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <div className="space-y-6 p-6">
          <CustomerCard customer={customer} />
          <Separator />
          <div>
            <h3 className="mb-2 text-sm font-semibold">Histórico de pedidos</h3>
            <CustomerHistory customerId={customer.id} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CampaignReservationsTab({ campaign }: { campaign: CampaignWithRelations }) {
  const numbersQuery = useRealtimeCampaign(campaign.id);
  const numbers = numbersQuery.data ?? [];
  const now = useNow();
  const queryClient = useQueryClient();

  const reservedNumbers = useMemo(() => {
    return numbers
      .filter((n) => {
        const status = resolveNumberStatus(n, now);
        return status === "RESERVED" || status === "PENDING_PAYMENT";
      })
      .sort((a, b) => a.number - b.number);
  }, [numbers, now]);

  const removeMutation = useMutation({
    mutationFn: async (number: number) => {
      await campaignNumberService.manageNumberStatus(campaign.id, number, "AVAILABLE");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["campaign-numbers", campaign.id] });
      toast.success("Reserva removida");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Falha"),
  });

  if (numbersQuery.isLoading) return <LoadingState label="Carregando reservas..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Reservas ativas</h3>
          <p className="text-sm text-muted-foreground">
            {reservedNumbers.length} numero{reservedNumbers.length === 1 ? "" : "s"} reservado
            {reservedNumbers.length === 1 ? "" : "s"}
          </p>
        </div>
        {reservedNumbers.length > 0 ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              reservedNumbers.forEach((n) =>
                campaignNumberService
                  .manageNumberStatus(campaign.id, n.number, "AVAILABLE")
                  .catch(() => {}),
              );
              void queryClient.invalidateQueries({
                queryKey: ["campaign-numbers", campaign.id],
              });
              toast.success(`${reservedNumbers.length} reserva(s) removida(s)`);
            }}
          >
            <Trash2 className="size-4" />
            Limpar todas
          </Button>
        ) : null}
      </div>

      {reservedNumbers.length === 0 ? (
        <EmptyState
          title="Nenhuma reserva ativa"
          description="Nao ha numeros reservados no momento."
        />
      ) : (
        <div className="grid gap-2">
          {reservedNumbers.map((n) => (
            <div key={n.number} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <span className="font-semibold tabular-nums">Nº {n.number}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {n.status === "PENDING_PAYMENT" ? "Pendente" : "Reservado"}
                </span>
                {n.reserved_until ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ate {new Date(n.reserved_until).toLocaleTimeString("pt-BR")}
                  </span>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(n.number)}
              >
                <Trash2 className="size-4" />
                Remover
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignDrawTab({ campaign }: { campaign: CampaignWithRelations }) {
  const { role, isGlobalAdmin } = useAuth();
  const canReset = isGlobalAdmin || role === "ADMIN";
  const isPublisher = role === "PUBLISHER";
  const maxAllowed = isPublisher ? 5 : undefined;

  const [winnerCount, setWinnerCount] = useState(1);
  const [winners, setWinners] = useState<DrawResult[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();

  const { data: drawView, isLoading } = useQuery({
    queryKey: ["draw", campaign.id],
    queryFn: () => loadDrawView({ data: { campaignId: campaign.id } }),
    enabled: true,
  });

  async function handleDraw() {
    setIsDrawing(true);
    try {
      const result = await performCampaignDraw({ data: { campaignId: campaign.id, winnerCount } });
      setWinners(result);
      void queryClient.invalidateQueries({ queryKey: ["draw", campaign.id] });
      void queryClient.invalidateQueries({ queryKey: ["campaign-numbers", campaign.id] });
      toast.success(`Sorteio realizado! ${result.length} vencedor(es).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao realizar sorteio");
    } finally {
      setIsDrawing(false);
    }
  }

  async function handleReset() {
    setIsResetting(true);
    try {
      await resetCampaignDraw({ data: { campaignId: campaign.id } });
      setWinners([]);
      void queryClient.invalidateQueries({ queryKey: ["draw", campaign.id] });
      void queryClient.invalidateQueries({ queryKey: ["campaign-numbers", campaign.id] });
      toast.success("Sorteio resetado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao resetar sorteio");
    } finally {
      setIsResetting(false);
    }
  }

  if (isLoading) return <LoadingState label="Carregando dados do sorteio..." />;

  const hasWinners = (drawView?.winners.length ?? 0) > 0;
  const displayWinners = hasWinners ? drawView!.winners : winners;

  const formattedDrawDate = drawView?.drawDate
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(drawView.drawDate))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Sorteio</h3>
        <p className="text-sm text-muted-foreground">
          Realize o sorteio dos numeros pagos da campanha.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{drawView?.paidNumbers ?? 0}</p>
            <p className="text-xs text-muted-foreground">Numeros pagos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{drawView?.totalNumbers ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total de numeros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{displayWinners.length}</p>
            <p className="text-xs text-muted-foreground">Vencedores</p>
          </CardContent>
        </Card>
      </div>

      {hasWinners && formattedDrawDate ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-200">
          <Clock className="size-4 shrink-0" />
          <span>
            Sorteio realizado em <strong>{formattedDrawDate}</strong>
          </span>
        </div>
      ) : null}

      {hasWinners ? (
        <>
          <Card className="border-success">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-5 text-amber-500" />
                Resultado do sorteio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {displayWinners.map((w, i) => (
                  <div
                    key={w.number}
                    className="flex items-center gap-3 rounded-lg border bg-success/5 p-4"
                  >
                    <div className="flex size-12 items-center justify-center rounded-full bg-success text-xl font-bold text-success-foreground">
                      {i + 1}º
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums">Nº {w.number}</p>
                      {w.customerName ? (
                        <p className="text-sm text-muted-foreground">{w.customerName}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {canReset ? (
            <Card className="border-destructive/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Resetar sorteio</p>
                    <p className="text-sm text-muted-foreground">
                      Desfaz o sorteio e devolve todos os numeros ao status PAGO.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleReset()}
                    disabled={isResetting}
                  >
                    <RotateCcw className="size-4" />
                    {isResetting ? "Resetando..." : "Resetar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : drawView?.canDraw ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <Trophy className="mx-auto size-12 text-muted-foreground" />
              <p className="mt-2 font-medium">Pronto para realizar o sorteio?</p>
              <p className="text-sm text-muted-foreground">
                Selecione a quantidade de vencedores e clique em Sortear.
                {isPublisher ? " Criadores podem sortear no maximo 5 numeros." : null}
              </p>
            </div>
            <div className="mx-auto max-w-xs space-y-2">
              <Label htmlFor="winner-count">Quantos vencedores?</Label>
              <Input
                id="winner-count"
                type="number"
                min={1}
                max={maxAllowed ?? drawView?.paidNumbers ?? 1}
                value={winnerCount}
                onChange={(e) => {
                  const v = Math.max(1, Number(e.target.value));
                  setWinnerCount(maxAllowed ? Math.min(v, maxAllowed) : v);
                }}
              />
              {isPublisher ? (
                <p className="text-xs text-muted-foreground">
                  Maximo: {MAX_DRAW_PER_PUBLISHER} vencedores por sorteio.
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={() => void handleDraw()}
              disabled={isDrawing}
            >
              <Trophy className="size-4" />
              {isDrawing ? "Sorteando..." : "Realizar sorteio"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Trophy}
          title="Sorteio nao disponivel"
          description={
            drawView?.status !== "FINISHED"
              ? "A campanha precisa estar FINALIZADA para realizar o sorteio."
              : drawView?.paidNumbers === 0
                ? "Nenhum numero pago para sortear."
                : "Sorteio ja realizado."
          }
        />
      )}
    </div>
  );
}

function CampaignParticipantsTab({ campaign }: { campaign: CampaignWithRelations }) {
  const { participants, isLoading, isError } = useCampaignParticipants(campaign.id);
  const [selected, setSelected] = useState<CampaignParticipant | null>(null);

  if (isLoading) return <LoadingState label="Carregando participantes..." />;
  if (isError) return <p className="text-sm text-destructive">Falha ao carregar participantes.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Participantes</h3>
          <p className="text-sm text-muted-foreground">
            {participants.length} participante{participants.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DownloadMenu
            onDownload={(format) =>
              downloadData(
                [
                  "Nome",
                  "Telefone",
                  "Email",
                  "Numeros",
                  "Pedidos",
                  "Pagos",
                  "Total",
                  "Origem",
                  "Ultima compra",
                ],
                participants.map((p) => [
                  p.customerName,
                  maskPhone(p.customerPhone),
                  maskEmail(p.customerEmail),
                  String(p.numbersCount),
                  String(p.ordersCount),
                  String(p.paidOrdersCount),
                  formatCurrency(p.totalSpent),
                  ORIGIN_LABELS[p.origin],
                  p.lastOrderDate,
                ]),
                format,
                `participantes-${campaign.slug}-mascarado`,
              )
            }
          />
          <DownloadMenu
            label="Export completo"
            onDownload={(format) =>
              downloadData(
                [
                  "Nome",
                  "Telefone",
                  "Email",
                  "Numeros",
                  "Pedidos",
                  "Pagos",
                  "Total",
                  "Origem",
                  "Ultima compra",
                ],
                participants.map((p) => [
                  p.customerName,
                  p.customerPhone,
                  p.customerEmail ?? "",
                  String(p.numbersCount),
                  String(p.ordersCount),
                  String(p.paidOrdersCount),
                  formatCurrency(p.totalSpent),
                  ORIGIN_LABELS[p.origin],
                  p.lastOrderDate,
                ]),
                format,
                `participantes-${campaign.slug}`,
              )
            }
          />
        </div>
      </div>

      {participants.length === 0 ? (
        <EmptyState
          title="Nenhum participante"
          description="Ainda nao existem participantes nesta campanha."
        />
      ) : (
        <div className="space-y-2">
          {participants.map((p) => (
            <button
              key={p.customerId}
              type="button"
              className="flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
              onClick={() => setSelected(p)}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.customerName}</p>
                <p className="text-xs text-muted-foreground">{maskPhone(p.customerPhone)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">
                  {p.numbersCount} num{p.numbersCount === 1 ? "" : "s"}
                </Badge>
                <Badge variant="outline">{ORIGIN_LABELS[p.origin]}</Badge>
                <span className="font-semibold tabular-nums">{formatCurrency(p.totalSpent)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <ParticipantSheet
          participant={selected}
          campaign={campaign}
          open={Boolean(selected)}
          onOpenChange={(open) => !open && setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function ParticipantSheet({
  participant,
  campaign,
  open,
  onOpenChange,
}: {
  participant: CampaignParticipant;
  campaign: CampaignWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const phoneDigits = participant.customerPhone.replace(/\D/g, "");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <div className="space-y-6 p-6">
          <div>
            <h3 className="text-lg font-semibold">{participant.customerName}</h3>
            <p className="text-sm text-muted-foreground">{participant.customerPhone}</p>
            {participant.customerEmail ? (
              <p className="text-sm text-muted-foreground">{participant.customerEmail}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {phoneDigits ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://wa.me/${phoneDigits}`, "_blank")}
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </Button>
            ) : null}
            <Badge variant="secondary">{ORIGIN_LABELS[participant.origin]}</Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Numeros</span>
              <p className="font-semibold">{participant.numbersCount}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pedidos</span>
              <p className="font-semibold">
                {participant.ordersCount} ({participant.paidOrdersCount} pagos)
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Total gasto</span>
              <p className="font-semibold">{formatCurrency(participant.totalSpent)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Valor pago</span>
              <p className="font-semibold">{formatCurrency(participant.paidAmount)}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 text-sm font-semibold">Pedidos</h4>
            <div className="space-y-2">
              {participant.orders.map((order) => (
                <div key={order.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs">#{order.id.slice(0, 8)}</p>
                    <Badge variant="outline">{order.source}</Badge>
                    <Badge variant={order.status === "PAID" ? "default" : "outline"}>
                      {order.status}
                    </Badge>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {order.numbers
                      .sort((a, b) => a - b)
                      .map((n) => (
                        <span
                          key={n}
                          className="rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums"
                        >
                          {n}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DownloadMenu({
  onDownload,
  label,
}: {
  onDownload: (format: "csv" | "xlsx" | "json") => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {label ? <span className="mr-1 text-xs text-muted-foreground">{label}</span> : null}
      <Button type="button" variant="outline" size="sm" onClick={() => onDownload("csv")}>
        CSV
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => onDownload("xlsx")}>
        Excel
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => onDownload("json")}>
        JSON
      </Button>
    </div>
  );
}
