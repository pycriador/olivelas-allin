import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { CustomerPicker } from "@/features/customers/components/customer-picker";
import { useImportSoldNumbers } from "@/features/orders/hooks/use-orders";
import { parseNumbersList } from "@/lib/number-input";
import type { CampaignWithRelations } from "@/types/campaign";
import type { Customer } from "@/types/customer";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_VALUES, type PaymentMethod } from "@/types/order";

export interface ImportNumbersDialogProps {
  campaign: CampaignWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportNumbersDialog({ campaign, open, onOpenChange }: ImportNumbersDialogProps) {
  const [text, setText] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [notes, setNotes] = useState("");

  const mutation = useImportSoldNumbers();

  const result = useMemo(
    () => parseNumbersList(text, campaign.number_end),
    [text, campaign.number_end],
  );

  const canImport = result.numbers.length > 0 && result.invalid.length === 0 && !mutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setText("");
          setCustomer(null);
          setPaymentMethod("PIX");
          setNotes("");
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar números vendidos</DialogTitle>
          <DialogDescription>
            Cole uma lista de números já vendidos (uma por linha ou separados por vírgula). O pedido
            será criado como pago.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Os números importados serão marcados como vendidos imediatamente.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="import-numbers-list">Lista de números</Label>
            <label className="cursor-pointer text-xs text-primary font-medium hover:underline flex items-center gap-1">
              <FileUp className="size-3" />
              Carregar arquivo TXT / CSV
              <input
                type="file"
                accept=".txt,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const content = event.target?.result as string;
                    if (content) {
                      setText(content);
                      toast.success(`Arquivo "${file.name}" carregado.`);
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
          <Textarea
            id="import-numbers-list"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Cole a lista ou envie um arquivo TXT/CSV (ex.: 1, 5, 8, 20, 50)"
            rows={5}
          />
          {result.invalid.length > 0 ? (
            <p className="text-xs font-medium text-destructive">
              Inválido: {result.invalid.join(", ")}
            </p>
          ) : null}
          <p className="text-xs tabular-nums text-muted-foreground">
            {result.numbers.length} números
            {result.duplicates.length > 0
              ? ` · ${result.duplicates.length} repetidos ignorados`
              : ""}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Cliente</Label>
          <CustomerPicker value={customer} onSelect={setCustomer} />
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

        <div className="space-y-2">
          <Label htmlFor="import-numbers-notes">Observações</Label>
          <Textarea
            id="import-numbers-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Opcional"
            rows={2}
          />
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={!canImport}
          onClick={() => {
            mutation.mutate(
              {
                campaignId: campaign.id,
                customerId: customer?.id ?? null,
                paymentMethod,
                notes,
                numbers: result.numbers,
              },
              {
                onSuccess: () => {
                  toast.success(`${result.numbers.length} números importados`);
                  onOpenChange(false);
                },
                onError: (error) => {
                  toast.error(error.message);
                },
              },
            );
          }}
        >
          <FileUp aria-hidden="true" />
          {mutation.isPending ? "Importando..." : "Importar números"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
