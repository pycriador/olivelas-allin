import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReservationTimer } from "./reservation-timer";
import { ReservationSummary } from "./reservation-summary";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { ActiveReservation } from "@/types/campaign-number";
import type { Campaign } from "@/types/campaign";
import { digitsOnly, renderWhatsAppTemplate } from "@/types/campaign";
import { orderService } from "@/services/order.service";

export interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign;
  reservation: ActiveReservation;
  onExpire: () => void;
  onCancel: () => void;
  isCancelling: boolean;
}

export function ReservationDialog({
  open,
  onOpenChange,
  campaign,
  reservation,
  onExpire,
  onCancel,
  isCancelling,
}: ReservationDialogProps) {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(reservation.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar o token");
    }
  }

  async function handleSendWhatsApp() {
    if (!name.trim() || phone.trim().length < 8) {
      toast.error("Informe seu nome e um WhatsApp válido para contato.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Criar pedido via WhatsApp (status WAITING_CONTACT)
      const res = await orderService.createWhatsApp({
        campaignId: campaign.id,
        token: reservation.token,
        reservedBy: reservation.reservedBy,
        customerName: name.trim(),
        customerPhone: phone.trim(),
      });

      if (!res.ok) {
        throw new Error(res.error ?? "Falha ao gerar pedido.");
      }

      setOrderCreated(true);
      toast.success("Pedido gerado com sucesso!");

      // 2. Formatar mensagem e abrir WhatsApp automaticamente
      const message = renderWhatsAppTemplate(campaign.whatsapp_message_template, {
        name: name.trim(),
        campaign: campaign.title,
        numbers: reservation.numbers.join(", "),
        total: formatCurrency(reservation.total),
      });

      const targetPhone = digitsOnly(campaign.contact_phone);
      if (targetPhone) {
        const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(
          "O organizador ainda nao configurou um telefone de contato para esta campanha.",
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a reserva.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deseja solicitar estes números?</DialogTitle>
          <DialogDescription>
            Confirme seus dados para reservar e enviar o comprovante ao organizador via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Token da reserva</p>
              <p className="truncate font-mono text-sm font-medium">{reservation.token}</p>
            </div>
            <Button type="button" variant="outline" size="icon" onClick={() => void copyToken()}>
              {copied ? (
                <Check aria-hidden="true" className="size-4 text-green-600" />
              ) : (
                <Copy aria-hidden="true" className="size-4" />
              )}
              <span className="sr-only">Copiar token</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Tempo restante de reserva</p>
              <p className="text-sm font-medium tabular-nums">
                {formatDateTime(reservation.reservedUntil)}
              </p>
            </div>
            <ReservationTimer until={reservation.reservedUntil} onExpire={onExpire} />
          </div>

          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              {reservation.numbers.length} número(s) selecionado(s)
            </p>
            <ReservationSummary numbers={reservation.numbers} maxNumber={campaign.number_end} />
          </div>

          <div className="space-y-3 rounded-lg border p-3 bg-card">
            <div className="space-y-1">
              <Label htmlFor="res-name" className="text-xs">
                Seu nome completo *
              </Label>
              <Input
                id="res-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maria Souza"
                disabled={orderCreated}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="res-phone" className="text-xs">
                Seu WhatsApp *
              </Label>
              <Input
                id="res-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                disabled={orderCreated}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(reservation.total)}</span>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isCancelling || isSubmitting}
            >
              {isCancelling ? "Cancelando…" : "Cancelar"}
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={isSubmitting || !name.trim() || phone.trim().length < 8}
              onClick={() => void handleSendWhatsApp()}
            >
              <MessageCircle className="size-4 mr-1.5" />
              {isSubmitting ? "Gerando pedido..." : "Enviar WhatsApp"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
