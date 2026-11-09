import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle, Copy, MessageCircle, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { orderService } from "@/services/order.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { CustomerPicker } from "@/features/customers/components/customer-picker";
import { QuickNumberInput } from "@/features/orders/components/quick-number-input";
import { WhatsAppMessagePicker } from "@/features/orders/components/whatsapp-message-picker";
import { useCreateManualOrder } from "@/features/orders/hooks/use-orders";
import { campaignNumberService } from "@/services/campaign-number.service";
import type { CampaignWithRelations } from "@/types/campaign";
import type { Customer } from "@/types/customer";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_VALUES, type PaymentMethod } from "@/types/order";
import { formatCurrency } from "@/lib/format";
import { renderWhatsAppTemplate } from "@/types/campaign";

function normalizeBrazilianWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return digits;

  let local = digits;
  if (local.startsWith("55") && local.length >= 12) {
    local = local.slice(2);
  }

  // Telefone móvel BR deve ter 11 dígitos (DDD 2 + 9 + 8).
  if (local.length === 10) {
    const ddd = local.slice(0, 2);
    const rest = local.slice(2);
    // Se o 9 do móvel estiver faltando, insere.
    local = `${ddd}9${rest}`;
  }

  return `55${local}`;
}

export interface ManualSaleDialogProps {
  campaign: CampaignWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultNumbers?: number[];
  defaultStatus?: "RESERVED" | "PAID" | "PENDING_PAYMENT";
}

export function ManualSaleDialog({
  campaign,
  open,
  onOpenChange,
  defaultNumbers,
  defaultStatus = "RESERVED",
}: ManualSaleDialogProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [numbers, setNumbers] = useState<number[]>(defaultNumbers ?? []);
  const [initialStatus, setInitialStatus] = useState<"RESERVED" | "PAID" | "PENDING_PAYMENT">(
    defaultStatus,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [confirmNumbers, setConfirmNumbers] = useState<number[] | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const mutation = useCreateManualOrder();

  const { data: states } = useQuery({
    queryKey: ["campaign-numbers", campaign.id],
    queryFn: () => campaignNumberService.listStates(campaign.id),
    enabled: open,
    staleTime: 30_000,
  });

  const unavailable = useMemo(() => {
    const taken = new Set(
      (states ?? []).filter((s) => s.status !== "AVAILABLE").map((s) => s.number),
    );
    return numbers.filter((number) => taken.has(number));
  }, [states, numbers]);

  const count = numbers.length;
  const subtotal = count * campaign.price_per_number;
  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);

  const canSubmit = count > 0 && unavailable.length === 0 && !mutation.isPending;

  const confirmationMessage = useMemo(() => {
    if (!confirmNumbers) return "";
    return renderWhatsAppTemplate(selectedTemplate ?? campaign.whatsapp_message_template, {
      name: customer?.full_name ?? "",
      campaign: campaign.title,
      numbers: confirmNumbers.join(", "),
      total: formatCurrency(total),
    });
  }, [
    confirmNumbers,
    selectedTemplate,
    campaign.whatsapp_message_template,
    campaign.title,
    customer,
    total,
  ]);

  function reset() {
    setCustomer(null);
    setNumbers(defaultNumbers ?? []);
    setInitialStatus(defaultStatus);
    setPaymentMethod("PIX");
    setDiscount("0");
    setNotes("");
    setConfirmNumbers(null);
    setSelectedTemplate(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Venda manual</DialogTitle>
          <DialogDescription>{campaign.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <CustomerPicker value={customer} onSelect={setCustomer} />
          </div>

          <div className="space-y-2">
            <Label>Números</Label>
            <QuickNumberInput maxNumber={campaign.number_end} onChange={setNumbers} />
            {unavailable.length > 0 ? (
              <p className="text-xs font-medium text-destructive">
                Já indisponíveis: {unavailable.join(", ")}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status inicial do pedido</Label>
              <Select
                value={initialStatus}
                onValueChange={(val) => setInitialStatus(val as typeof initialStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESERVED">Reservado (Aberto)</SelectItem>
                  <SelectItem value="PENDING_PAYMENT">Aguardando pagamento</SelectItem>
                  <SelectItem value="PAID">Pago (Confirmado)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_VALUES.map((method) => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-sale-discount">Desconto (R$)</Label>
            <Input
              id="manual-sale-discount"
              type="number"
              min={0}
              step="0.01"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-sale-notes">Observações</Label>
            <Textarea
              id="manual-sale-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>

          {numbers.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {numbers.slice(0, 40).map((number) => (
                <Badge key={number} variant="secondary" className="tabular-nums">
                  {number}
                </Badge>
              ))}
              {numbers.length > 40 ? <Badge variant="outline">+{numbers.length - 40}</Badge> : null}
            </div>
          ) : null}

          <Separator />

          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Desconto</dt>
              <dd className="tabular-nums">- {formatCurrency(discountValue)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCurrency(total)}</dd>
            </div>
          </dl>

          <Button
            type="button"
            className="w-full"
            disabled={!canSubmit}
            onClick={() => {
              const mappedStatus =
                initialStatus === "PAID"
                  ? ("PAID" as const)
                  : initialStatus === "PENDING_PAYMENT"
                    ? ("WAITING_PAYMENT" as const)
                    : null;

              mutation.mutate(
                {
                  campaignId: campaign.id,
                  customerId: customer?.id ?? null,
                  paymentMethod,
                  discount: discountValue,
                  notes,
                  numbers,
                  initialStatus: mappedStatus,
                },
                {
                  onSuccess: () => {
                    setConfirmNumbers([...numbers]);
                    toast.success("Venda registrada com sucesso");
                  },
                  onError: (error) => {
                    toast.error(error.message);
                  },
                },
              );
            }}
          >
            <ShoppingCart aria-hidden="true" />
            {mutation.isPending ? "Registrando..." : "Registrar venda"}
          </Button>
        </div>
      </DialogContent>

      <Dialog
        open={confirmNumbers !== null}
        onOpenChange={(next) => {
          if (!next) {
            setConfirmNumbers(null);
            onOpenChange(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-500" />
              Venda registrada
            </DialogTitle>
            <DialogDescription>Envie a confirmação para o cliente.</DialogDescription>
          </DialogHeader>

          <WhatsAppMessagePicker
            campaignId={campaign.id}
            defaultContent={campaign.whatsapp_message_template}
            value={(selectedTemplate ?? campaign.whatsapp_message_template) ?? ""}
            onChange={setSelectedTemplate}
          />

          <Textarea
            readOnly
            value={confirmationMessage}
            rows={4}
          />

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            {customer?.phone ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const msg = encodeURIComponent(confirmationMessage);
                  const clean = normalizeBrazilianWhatsAppNumber(customer.phone);
                  window.open(`https://wa.me/${clean}?text=${msg}`, "_blank");
                }}
              >
                <MessageCircle className="size-4" />
                Enviar WhatsApp
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(confirmationMessage);
                toast.success("Mensagem copiada!");
              }}
            >
              <Copy className="size-4" />
              Copiar mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
