import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  TimerReset,
} from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/features/dashboard/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { usePermissions } from "@/hooks/use-permissions";
import { gatewayPermission } from "@/lib/permissions";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  getPaymentDetailAdminFn,
  listPaymentsAdminFn,
  reconcilePaymentAdminFn,
  retryPaymentAdminFn,
} from "@/lib/payments/payment-admin.server";
import {
  PAYMENT_GATEWAY_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VALUES,
  type PaymentGateway,
  type PaymentStatus,
} from "@/types/payment";

export function PaymentsListView({
  gateway,
  showMetrics = false,
}: {
  gateway?: PaymentGateway;
  showMetrics?: boolean;
}) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageSize = 15;

  const canManageGateway = (g: PaymentGateway) =>
    can(gatewayPermission(g, "manage")) || can("payments.manage");

  const listQuery = useQuery({
    queryKey: ["admin", "payments", gateway ?? "ALL", page, pageSize, statusFilter, search],
    queryFn: () =>
      listPaymentsAdminFn({
        data: {
          page,
          pageSize,
          gateway: gateway ?? "ALL",
          status: statusFilter,
          search: search || undefined,
        },
      }),
  });

  const detailQuery = useQuery({
    queryKey: ["admin", "payment-detail", selectedId],
    queryFn: () => getPaymentDetailAdminFn({ data: { paymentId: selectedId! } }),
    enabled: Boolean(selectedId),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
    if (selectedId) {
      await queryClient.invalidateQueries({ queryKey: ["admin", "payment-detail", selectedId] });
    }
  };

  const reconcileOne = useMutation({
    mutationFn: (paymentId: string) => reconcilePaymentAdminFn({ data: { paymentId } }),
    onSuccess: async (result) => {
      toast.success(result.message);
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const retryMutation = useMutation({
    mutationFn: (orderId: string) => retryPaymentAdminFn({ data: { orderId } }),
    onSuccess: async (payment) => {
      toast.success(`Nova tentativa #${payment.attemptNumber} criada`);
      setSelectedId(payment.id);
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const items = listQuery.data?.items ?? [];
  const metrics = listQuery.data?.metrics;
  const totalPages = Math.max(1, Math.ceil((listQuery.data?.total ?? 0) / pageSize));
  const detail = detailQuery.data;

  const openSelected = useMemo(
    () =>
      Boolean(detail && ["CREATED", "PENDING", "WAITING_PAYMENT"].includes(detail.payment.status)),
    [detail],
  );

  const isManual = detail?.payment.kind === "MANUAL";
  const isAdvancedFee = detail?.payment.gateway === "ADVANCED_FEE";
  const isNonGateway = isManual || isAdvancedFee;

  const canRetry = useMemo(
    () =>
      Boolean(
        !isNonGateway &&
        detail?.order &&
        ["WAITING_PAYMENT", "OPEN", "EXPIRED"].includes(detail.order.status) &&
        ["FAILED", "EXPIRED", "CANCELLED", "WAITING_PAYMENT"].includes(detail.payment.status),
      ),
    [detail, isNonGateway],
  );

  const canManageDetail =
    !isNonGateway &&
    detail !== undefined &&
    detail !== null &&
    canManageGateway(detail.payment.gateway);

  return (
    <div className="space-y-6">
      {showMetrics ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Aguardando" value={String(metrics?.waiting ?? 0)} icon={Clock} />
          <StatCard title="Pagos" value={String(metrics?.paid ?? 0)} icon={DollarSign} />
          <StatCard title="Expirados" value={String(metrics?.expired ?? 0)} icon={TimerReset} />
          <StatCard
            title="Falhas/Cancelados"
            value={String(metrics?.failed ?? 0)}
            icon={AlertTriangle}
          />
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, pedido, payment id..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as PaymentStatus | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {PAYMENT_STATUS_VALUES.map((s) => (
              <SelectItem key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {listQuery.isPending ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum pagamento encontrado.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((payment) => (
                <button
                  key={payment.id}
                  type="button"
                  onClick={() => setSelectedId(payment.id)}
                  className="flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {payment.customerName ?? "Consumidor final"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      #{payment.id.slice(0, 8)} · pedido {payment.orderId.slice(0, 8)} ·{" "}
                      {payment.campaignTitle ?? "—"} · {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{PAYMENT_GATEWAY_LABELS[payment.gateway]}</Badge>
                    <Badge
                      variant={
                        payment.status === "PAID"
                          ? "default"
                          : payment.status === "WAITING_PAYMENT" || payment.status === "PENDING"
                            ? "secondary"
                            : payment.status === "FAILED" || payment.status === "CANCELLED"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Badge>
                    <Badge variant="outline">#{payment.attemptNumber}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(payment.createdAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {listQuery.data?.total ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {listQuery.data.total} pagamento(s) · pagina {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Proxima
            </Button>
          </div>
        </div>
      ) : null}

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalhe do pagamento</SheetTitle>
          </SheetHeader>
          {detailQuery.isPending ? (
            <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
          ) : !detail ? (
            <p className="mt-6 text-sm text-muted-foreground">Pagamento nao encontrado.</p>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="space-y-1">
                <p className="text-sm font-medium">{detail.customer?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {detail.customer?.phone ?? "—"} · {detail.customer?.email ?? "sem e-mail"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p>{PAYMENT_STATUS_LABELS[detail.payment.status]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p>{formatCurrency(detail.payment.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gateway</p>
                  <p>{PAYMENT_GATEWAY_LABELS[detail.payment.gateway]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p>
                    {detail.payment.gateway === "ADVANCED_FEE"
                      ? "Taxa Avançada"
                      : detail.payment.kind === "MANUAL"
                        ? "Manual"
                        : "Gateway"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tentativa</p>
                  <p>#{detail.payment.attemptNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Payment ID externo</p>
                  <p className="break-all font-mono text-xs">
                    {detail.payment.gatewayPaymentId ?? "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Campanha</p>
                  <p>{detail.campaign?.title ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Numeros</p>
                  <p className="text-xs">{detail.numbers.join(", ") || "—"}</p>
                </div>
              </div>
              {canManageDetail ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reconcileOne.isPending}
                    onClick={() => reconcileOne.mutate(detail.payment.id)}
                  >
                    {reconcileOne.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    Consultar gateway
                  </Button>
                  {canRetry ? (
                    <Button
                      size="sm"
                      disabled={retryMutation.isPending || openSelected}
                      onClick={() => retryMutation.mutate(detail.payment.orderId)}
                    >
                      {retryMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RotateCcw className="size-4" />
                      )}
                      Tentar novamente
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {openSelected ? (
                <p className="text-xs text-muted-foreground">
                  Ha tentativa aberta. Concilie ou aguarde expirar antes de criar outra.
                </p>
              ) : null}
              <Separator />
              <div>
                <h4 className="mb-3 text-sm font-semibold">Timeline</h4>
                <ol className="space-y-3">
                  {detail.timeline.map((item, index) => (
                    <li key={`${item.at}-${item.type}-${index}`} className="relative pl-4">
                      <span className="absolute left-0 top-1.5 size-2 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(item.at)}
                        {item.status ? ` · ${item.status}` : ""}
                        {item.detail ? ` · ${item.detail}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
              {detail.attempts.length > 1 ? (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Tentativas</h4>
                  <div className="space-y-2">
                    {detail.attempts.map((attempt) => (
                      <button
                        key={attempt.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded border px-3 py-2 text-left text-xs"
                        onClick={() => setSelectedId(attempt.id)}
                      >
                        <span>
                          #{attempt.attemptNumber} · {PAYMENT_STATUS_LABELS[attempt.status]}
                        </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(attempt.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {detail.events.length > 0 ? (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Webhooks</h4>
                  <div className="space-y-2">
                    {detail.events.map((event) => (
                      <div key={event.id} className="rounded border px-3 py-2 text-xs">
                        <p className="font-medium">{event.eventType}</p>
                        <p className="text-muted-foreground">
                          {formatDateTime(event.createdAt)} ·{" "}
                          {event.processed ? "processado" : "nao processado"}
                          {event.errorMessage ? ` · ${event.errorMessage}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
