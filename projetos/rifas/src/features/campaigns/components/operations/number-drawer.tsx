import { useState } from "react";
import { toast } from "sonner";
import { ArrowRightLeft, ExternalLink, Phone, Receipt, Trash2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

import { NumberHistory } from "./number-history";
import { useRemoveOrderNumbers, useSwapOrderNumber } from "@/features/orders/hooks/use-orders";
import type { EnrichedNumber } from "./number-types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "./status-constants";

export interface NumberDrawerProps {
  number: EnrichedNumber;
  maxNumber: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewOrder?: (orderId: string) => void;
  onViewCustomer?: (customerId: string) => void;
}

export function NumberDrawer({
  number,
  maxNumber,
  open,
  onOpenChange,
  onViewOrder,
  onViewCustomer,
}: NumberDrawerProps) {
  const [swapValue, setSwapValue] = useState("");
  const [showSwap, setShowSwap] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [confirmReleaseAndCancel, setConfirmReleaseAndCancel] = useState(false);

  const removeMutation = useRemoveOrderNumbers();
  const swapMutation = useSwapOrderNumber();

  function handleRelease(cancelOrder: boolean) {
    if (!number.orderId) return;
    removeMutation.mutate(
      { orderId: number.orderId, numbers: [number.number] },
      {
        onSuccess: () => {
          toast.success(cancelOrder ? "Número liberado e pedido cancelado" : "Número liberado");
          setConfirmRelease(false);
          setConfirmReleaseAndCancel(false);
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleSwap() {
    const newNumber = Number(swapValue);
    if (!Number.isInteger(newNumber) || newNumber < 1 || newNumber > maxNumber) {
      toast.error(`Informe um número entre 1 e ${maxNumber}`);
      return;
    }
    if (!number.orderId) return;
    swapMutation.mutate(
      { orderId: number.orderId, oldNumber: number.number, newNumber },
      {
        onSuccess: () => {
          toast.success(`Número trocado: ${number.number} → ${newNumber}`);
          setShowSwap(false);
          setSwapValue("");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  const hasOrder = Boolean(number.orderId);
  const isLastItem = hasOrder && (number.orderItemCount ?? 0) <= 1;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
          <ScrollArea className="flex-1">
            <div className="space-y-6 p-6">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="text-lg font-semibold tabular-nums">Nº {number.number}</span>
                  <Badge className={STATUS_BADGE_CLASSES[number.status] ?? ""}>
                    {STATUS_LABELS[number.status] ?? number.status}
                  </Badge>
                </SheetTitle>
              </SheetHeader>

              {number.customerName ? (
                <section className="space-y-1">
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <User aria-hidden="true" className="size-4" />
                    Cliente
                  </h3>
                  <p className="text-sm font-medium">{number.customerName}</p>
                  {number.customerPhone ? (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone aria-hidden="true" className="size-3.5" />
                      {number.customerPhone}
                    </p>
                  ) : null}
                  {onViewCustomer && number.customerId ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => onViewCustomer(number.customerId!)}
                    >
                      Ver cliente
                      <ExternalLink aria-hidden="true" className="ml-1 size-3" />
                    </Button>
                  ) : null}
                </section>
              ) : null}

              {hasOrder ? (
                <section className="space-y-1">
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Receipt aria-hidden="true" className="size-4" />
                    Pedido
                  </h3>
                  <p className="font-mono text-sm">#{number.orderId!.slice(0, 8)}</p>
                  <div className="flex flex-wrap gap-1.5 text-sm text-muted-foreground">
                    {number.orderSource ? (
                      <Badge variant="secondary">{number.orderSource}</Badge>
                    ) : null}
                    {number.paymentMethod ? (
                      <Badge variant="outline">{number.paymentMethod}</Badge>
                    ) : null}
                    {number.orderTotal != null ? (
                      <span className="font-medium tabular-nums">
                        {formatCurrency(number.orderTotal)}
                      </span>
                    ) : null}
                  </div>
                  {onViewOrder && number.orderId ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => onViewOrder(number.orderId!)}
                    >
                      Ver pedido
                      <ExternalLink aria-hidden="true" className="ml-1 size-3" />
                    </Button>
                  ) : null}
                </section>
              ) : null}

              <Separator />

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Ações</h3>
                <div className="flex flex-wrap gap-2">
                  {hasOrder ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (isLastItem) {
                            setConfirmReleaseAndCancel(true);
                          } else {
                            setConfirmRelease(true);
                          }
                        }}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 aria-hidden="true" />
                        Liberar número
                      </Button>

                      {showSwap ? (
                        <div className="flex w-full items-end gap-2">
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="drawer-swap" className="text-xs">
                              Novo número
                            </Label>
                            <Input
                              id="drawer-swap"
                              type="number"
                              min={1}
                              max={maxNumber}
                              value={swapValue}
                              onChange={(event) => setSwapValue(event.target.value)}
                              placeholder={`1-${maxNumber}`}
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!swapValue || swapMutation.isPending}
                            onClick={handleSwap}
                          >
                            Confirmar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSwap(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSwap(true)}
                          disabled={swapMutation.isPending}
                        >
                          <ArrowRightLeft aria-hidden="true" />
                          Trocar número
                        </Button>
                      )}
                    </>
                  ) : null}
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="mb-2 text-sm font-semibold">Detalhes</h3>
                <dl className="space-y-1 text-xs">
                  <Row label="ID" value={number.id.slice(0, 8)} mono />
                  <Row label="Criado em" value={formatDateTime(number.createdAt)} />
                  <Row label="Atualizado em" value={formatDateTime(number.updatedAt)} />
                  {number.reservedBy ? (
                    <Row label="Reservado por" value={number.reservedBy.slice(0, 8)} mono />
                  ) : null}
                </dl>
              </section>

              <Separator />

              <section>
                <h3 className="mb-2 text-sm font-semibold">Histórico do número</h3>
                <NumberHistory campaignNumberId={number.id} />
              </section>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmRelease}
        onOpenChange={setConfirmRelease}
        title={`Liberar número ${number.number}?`}
        description="O número será removido do pedido e ficará disponível novamente."
        confirmLabel="Liberar"
        onConfirm={() => handleRelease(false)}
      />

      <ConfirmDialog
        open={confirmReleaseAndCancel}
        onOpenChange={setConfirmReleaseAndCancel}
        title={`Liberar número ${number.number}?`}
        description="Este é o último número do pedido. Deseja cancelar o pedido também?"
        confirmLabel="Liberar e cancelar pedido"
        onConfirm={() => handleRelease(true)}
      />
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono" : ""}>{value}</dd>
    </div>
  );
}
