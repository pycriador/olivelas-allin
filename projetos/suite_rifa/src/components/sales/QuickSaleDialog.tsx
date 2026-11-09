import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuickSale } from "@/hooks/useSales";
import type { PaymentMethod } from "@/services/types";
import { PAYMENT_METHOD_LABEL } from "@/services/types";

interface QuickSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  selectedNumbers: number[];
  onClearSelection: () => void;
  currency?: string;
}

export function QuickSaleDialog({
  open,
  onOpenChange,
  campaignId,
  selectedNumbers,
  onClearSelection,
  currency = "BRL",
}: QuickSaleDialogProps) {
  const quickSale = useQuickSale();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("OTHER");
  const [notes, setNotes] = useState("");

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !phone.trim() || selectedNumbers.length === 0) return;

    const payload: {
      name: string;
      phone: string;
      numbers: number[];
      payment_method?: PaymentMethod;
      notes?: string;
    } = {
      name: name.trim(),
      phone: phone.trim(),
      numbers: selectedNumbers,
    };
    if (paymentMethod !== "OTHER") payload.payment_method = paymentMethod;
    if (notes.trim()) payload.notes = notes.trim();

    quickSale.mutate(
      {
        campaignId,
        data: payload,
      },
      {
        onSuccess: () => {
          setName("");
          setPhone("");
          setPaymentMethod("OTHER");
          setNotes("");
          onClearSelection();
          onOpenChange(false);
        },
      },
    );
  }, [campaignId, name, phone, selectedNumbers, paymentMethod, notes, quickSale, onClearSelection, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Venda rápida</DialogTitle>
          <DialogDescription>
            Registre a venda de {selectedNumbers.length} número(s) para um novo participante.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="qs-name">Nome *</Label>
            <Input
              id="qs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do participante"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qs-phone">Telefone *</Label>
            <Input
              id="qs-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qs-notes">Observações</Label>
            <Input
              id="qs-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm">
            <span className="text-muted-foreground">Números selecionados: </span>
            <span className="font-mono font-medium">{selectedNumbers.sort((a, b) => a - b).join(", ")}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !phone.trim() || selectedNumbers.length === 0 || quickSale.isPending}>
            {quickSale.isPending ? "Registrando…" : "Registrar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
