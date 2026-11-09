import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { useSetOrderStatus } from "@/features/orders/hooks/use-orders";
import { WhatsAppMessagePicker } from "@/features/orders/components/whatsapp-message-picker";
import { ORDER_EDITABLE_STATUSES, type OrderWithRelations } from "@/types/order";
import type { CampaignWithRelations } from "@/types/campaign";
import { digitsOnly, renderWhatsAppTemplate } from "@/types/campaign";
import { formatCurrency } from "@/lib/format";

export interface WhatsAppDialogProps {
  order: OrderWithRelations;
  campaign: CampaignWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppDialog({ order, campaign, open, onOpenChange }: WhatsAppDialogProps) {
  const [copied, setCopied] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const setStatus = useSetOrderStatus();

  const numbers = [...order.items].map((item) => item.number).sort((a, b) => a - b);
  const customerName = order.customer?.full_name ?? "Cliente";
  const phone = digitsOnly(order.customer?.phone ?? campaign?.contact_phone);

  const template = selectedContent ?? campaign?.whatsapp_message_template;

  const message = renderWhatsAppTemplate(template, {
    name: customerName,
    campaign: campaign?.title ?? "Rifa",
    numbers: numbers.join(", "),
    total: formatCurrency(order.total),
  });

  const canSend = phone.length > 0;

  function openWhatsApp() {
    if (!canSend) return;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar a mensagem");
    }
  }

  const canAdvance = ORDER_EDITABLE_STATUSES.includes(order.status);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSelectedContent(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contato via WhatsApp</DialogTitle>
          <DialogDescription>
            {customerName} · {phone ? `+${phone}` : "sem telefone cadastrado"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {numbers.map((number) => (
              <Badge key={number} variant="secondary" className="tabular-nums">
                {number}
              </Badge>
            ))}
          </div>

          {campaign ? (
            <WhatsAppMessagePicker
              campaignId={campaign.id}
              defaultContent={campaign.whatsapp_message_template}
              value={template ?? ""}
              onChange={(content) => setSelectedContent(content)}
            />
          ) : null}

          <Textarea value={message} readOnly rows={6} className="text-sm" />

          {!canSend ? (
            <p className="text-xs text-destructive">
              Informe um telefone válido para o cliente ou defina o telefone de contato da campanha.
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={copyMessage}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <div className="flex gap-2">
            {canAdvance ? (
              <Button
                type="button"
                variant="outline"
                disabled={setStatus.isPending}
                onClick={() => {
                  setStatus.mutate(
                    { orderId: order.id, status: "WAITING_PAYMENT" },
                    {
                      onSuccess: () => toast.success("Pedido aguardando pagamento"),
                      onError: (error) => toast.error(error.message),
                    },
                  );
                }}
              >
                Marcar aguardando pagamento
              </Button>
            ) : null}
            <Button type="button" disabled={!canSend} onClick={openWhatsApp}>
              <MessageCircle aria-hidden="true" />
              Abrir WhatsApp
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
