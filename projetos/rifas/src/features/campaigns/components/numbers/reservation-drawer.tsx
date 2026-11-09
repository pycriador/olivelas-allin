import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ReservationSummary } from "./reservation-summary";
import { formatCurrency } from "@/lib/format";
import type { Campaign } from "@/types/campaign";

export interface ReservationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign;
  selected: number[];
  totalValue: number;
  isReserving: boolean;
  onContinue: () => void;
}

export function ReservationDrawer({
  open,
  onOpenChange,
  campaign,
  selected,
  totalValue,
  isReserving,
  onContinue,
}: ReservationDrawerProps) {
  const quantity = selected.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col sm:max-w-md">
        <SheetHeader className="pr-8">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart aria-hidden="true" className="size-4" />
            Sua seleção
          </SheetTitle>
          <SheetDescription>
            {campaign.title} · {formatCurrency(campaign.price_per_number)} por número
          </SheetDescription>
        </SheetHeader>

        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Números selecionados</span>
          <span className="font-semibold tabular-nums">{quantity}</span>
        </div>

        <ScrollArea className="min-h-0 flex-1 py-4">
          <ReservationSummary numbers={selected} maxNumber={campaign.number_end} />
        </ScrollArea>

        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor unitário</span>
            <span className="tabular-nums">{formatCurrency(campaign.price_per_number)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({quantity} × {formatCurrency(campaign.price_per_number)})
            </span>
            <span className="tabular-nums">{formatCurrency(totalValue)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(totalValue)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Ao continuar, os números ficarão reservados por {campaign.reservation_timeout_minutes}{" "}
            minutos.
          </p>
          <Button
            className="w-full"
            size="lg"
            disabled={quantity === 0 || isReserving}
            onClick={onContinue}
          >
            {isReserving ? "Reservando…" : "Continuar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
