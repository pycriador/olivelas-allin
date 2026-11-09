import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { Eye, FileText, MessageCircle, Paperclip, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { OrderSourceBadge } from "@/features/orders/components/order-source-badge";
import { PaymentBadge } from "@/features/orders/components/payment-badge";
import { QuickNumberInput } from "@/features/orders/components/quick-number-input";
import { OrderTimeline } from "@/features/orders/components/order-timeline";
import { WhatsAppDialog } from "@/features/orders/components/whatsapp-dialog";
import {
  useAddOrderNumbers,
  useRemoveOrderNumbers,
  useSetOrderStatus,
  useSwapOrderNumber,
  useUploadReceipt,
} from "@/features/orders/hooks/use-orders";
import { orderService } from "@/services/order.service";
import type { CampaignWithRelations } from "@/types/campaign";
import {
  ORDER_EDITABLE_STATUSES,
  ORDER_TERMINAL_STATUSES,
  type OrderStatus,
  type OrderWithRelations,
} from "@/types/order";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface StatusAction {
  to: OrderStatus;
  label: string;
  variant?: "default" | "outline" | "destructive";
}

const STATUS_ACTIONS: Partial<Record<OrderStatus, StatusAction[]>> = {
  OPEN: [
    { to: "WAITING_PAYMENT", label: "Aguardando pagamento" },
    { to: "CANCELLED", label: "Cancelar pedido", variant: "destructive" },
  ],
  WAITING_CONTACT: [
    { to: "WAITING_PAYMENT", label: "Aguardando pagamento" },
    { to: "CANCELLED", label: "Cancelar pedido", variant: "destructive" },
  ],
  WAITING_PAYMENT: [
    { to: "PAID", label: "Confirmar pagamento" },
    { to: "CANCELLED", label: "Cancelar pedido", variant: "destructive" },
  ],
  PAID: [{ to: "REFUNDED", label: "Reembolsar", variant: "outline" }],
};

export interface OrderDetailDialogProps {
  order: OrderWithRelations;
  campaign: CampaignWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({ order, campaign, open, onOpenChange }: OrderDetailDialogProps) {
  const queryClient = useQueryClient();
  const [addText, setAddText] = useState("");
  const [addNumbers, setAddNumbers] = useState<number[]>([]);
  const [swapOld, setSwapOld] = useState("");
  const [swapNew, setSwapNew] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const setStatus = useSetOrderStatus();
  const addMutation = useAddOrderNumbers();
  const removeMutation = useRemoveOrderNumbers();
  const swapMutation = useSwapOrderNumber();
  const uploadMutation = useUploadReceipt();

  const editable = ORDER_EDITABLE_STATUSES.includes(order.status);
  const terminal = ORDER_TERMINAL_STATUSES.includes(order.status);
  const actions = STATUS_ACTIONS[order.status] ?? [];

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
  }

  function runStatusAction(next: OrderStatus) {
    setStatus.mutate(
      { orderId: order.id, status: next },
      {
        onSuccess: (result) => {
          if (result?.unchanged) return;
          toast.success("Status atualizado");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleAddNumbers() {
    if (addNumbers.length === 0) return;
    addMutation.mutate(
      { orderId: order.id, numbers: addNumbers },
      {
        onSuccess: () => {
          toast.success("Números adicionados");
          setAddText("");
          setAddNumbers([]);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleSwap() {
    const oldNumber = Number(swapOld);
    const newNumber = Number(swapNew);
    if (!Number.isInteger(oldNumber) || !Number.isInteger(newNumber) || oldNumber < 1) return;
    swapMutation.mutate(
      { orderId: order.id, oldNumber, newNumber },
      {
        onSuccess: () => {
          toast.success("Número trocado");
          setSwapOld("");
          setSwapNew("");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  async function openReceipt(storagePath: string) {
    try {
      const url = await orderService.receiptUrl(storagePath);
      if (!url) throw new Error("URL indisponível");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao abrir comprovante");
    }
  }

  async function deleteReceipt(receiptId: string, storagePath: string) {
    try {
      await orderService.deleteReceipt(receiptId, storagePath);
      invalidate();
      toast.success("Comprovante removido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao remover comprovante");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="space-y-5 p-6">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="font-mono text-base">
                    Pedido #{order.id.slice(0, 8)}
                  </DialogTitle>
                  <OrderStatusBadge status={order.status} />
                  <OrderSourceBadge source={order.source} />
                </div>
                <DialogDescription>
                  {order.campaign?.title ?? "Campanha"} · {formatDateTime(order.created_at)}
                </DialogDescription>
              </DialogHeader>

              {actions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Button
                      key={action.to}
                      type="button"
                      size="sm"
                      variant={action.variant ?? "default"}
                      disabled={setStatus.isPending}
                      onClick={() => runStatusAction(action.to)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              ) : null}

              {!terminal ? (
                <Button type="button" variant="outline" onClick={() => setWhatsappOpen(true)}>
                  <MessageCircle aria-hidden="true" />
                  Contato via WhatsApp
                </Button>
              ) : null}

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Cliente</h3>
                {order.customer ? (
                  <div className="text-sm">
                    <p className="font-medium">{order.customer.full_name}</p>
                    <p className="text-muted-foreground">
                      {order.customer.phone}
                      {order.customer.email ? ` · ${order.customer.email}` : ""}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Consumidor final</p>
                )}
              </section>

              <Separator />

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Números ({order.items.length})</h3>
                  {order.payment_method ? <PaymentBadge method={order.payment_method} /> : null}
                </div>
                <ul className="flex flex-wrap gap-1">
                  {[...order.items]
                    .sort((a, b) => a.number - b.number)
                    .map((item) => (
                      <li key={item.id}>
                        <Badge
                          variant="secondary"
                          className="tabular-nums"
                          data-paid={item.status === "PAID" ? true : undefined}
                        >
                          {item.number}
                          {editable ? (
                            <button
                              type="button"
                              aria-label={`Remover número ${item.number}`}
                              className="ml-1 text-muted-foreground hover:text-destructive"
                              disabled={removeMutation.isPending}
                              onClick={() =>
                                removeMutation.mutate(
                                  { orderId: order.id, numbers: [item.number] },
                                  {
                                    onSuccess: () => toast.success("Número removido"),
                                    onError: (error) => toast.error(error.message),
                                  },
                                )
                              }
                            >
                              <X aria-hidden="true" className="size-3" />
                            </button>
                          ) : null}
                        </Badge>
                      </li>
                    ))}
                </ul>

                {editable ? (
                  <div className="space-y-2 rounded-md border p-3">
                    <QuickNumberInput
                      maxNumber={
                        campaign?.number_end ??
                        order.items.reduce(
                          (max, item) => Math.max(max, item.number),
                          order.items[0]?.number ?? 1,
                        )
                      }
                      onChange={(numbers) => setAddNumbers(numbers)}
                      className="!space-y-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={addNumbers.length === 0 || addMutation.isPending}
                      onClick={handleAddNumbers}
                    >
                      <Plus aria-hidden="true" />
                      Adicionar números
                    </Button>

                    <div className="flex items-end gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="swap-old" className="text-xs">
                          Trocar de
                        </Label>
                        <Input
                          id="swap-old"
                          type="number"
                          min={1}
                          value={swapOld}
                          onChange={(event) => setSwapOld(event.target.value)}
                          className="w-24"
                        />
                      </div>
                      <span className="pb-2 text-sm text-muted-foreground">→</span>
                      <div className="space-y-1">
                        <Label htmlFor="swap-new" className="text-xs">
                          para
                        </Label>
                        <Input
                          id="swap-new"
                          type="number"
                          min={1}
                          value={swapNew}
                          onChange={(event) => setSwapNew(event.target.value)}
                          className="w-24"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!swapOld || !swapNew || swapMutation.isPending}
                        onClick={handleSwap}
                      >
                        Trocar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </section>

              <Separator />

              <section className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Paperclip aria-hidden="true" className="size-4" />
                  Comprovantes
                </h3>
                {order.receipts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum comprovante enviado.</p>
                ) : (
                  <ul className="space-y-2">
                    {order.receipts.map((receipt) => (
                      <li
                        key={receipt.id}
                        className="flex items-center gap-2 rounded-md border px-3 py-2"
                      >
                        <FileText aria-hidden="true" className="size-4 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm">{receipt.filename}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Abrir comprovante"
                          onClick={() => openReceipt(receipt.storage_path)}
                        >
                          <Eye aria-hidden="true" className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remover comprovante"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteReceipt(receipt.id, receipt.storage_path)}
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <label className="block">
                  <span className="sr-only">Enviar comprovante</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                    className="hidden"
                    disabled={uploadMutation.isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      uploadMutation.mutate(
                        { orderId: order.id, file },
                        {
                          onSuccess: () => {
                            toast.success("Comprovante enviado");
                            event.target.value = "";
                          },
                          onError: (error) => {
                            toast.error(error.message);
                            event.target.value = "";
                          },
                        },
                      );
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={uploadMutation.isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadMutation.isPending ? "Enviando..." : "Enviar comprovante"}
                  </Button>
                </label>
              </section>

              <Separator />

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Resumo</h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Desconto</dt>
                    <dd className="tabular-nums">- {formatCurrency(order.discount)}</dd>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
                  </div>
                </dl>
                {order.notes ? (
                  <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {order.notes}
                  </p>
                ) : null}
              </section>

              <Separator />

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Histórico</h3>
                <OrderTimeline orderId={order.id} />
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {whatsappOpen ? (
        <WhatsAppDialog
          order={order}
          campaign={campaign}
          open={whatsappOpen}
          onOpenChange={setWhatsappOpen}
        />
      ) : null}
    </>
  );
}
