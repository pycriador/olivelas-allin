import { useMemo, useState, type MouseEvent } from "react";
import { ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NumberFilter } from "./number-filter";
import { NumberGrid } from "./number-grid";
import { NumberLegend } from "./number-legend";
import { NumberSearch } from "./number-search";
import { QuickPick } from "./quick-pick";
import { useNumberGrid, type NumberFilterValue } from "../../hooks/use-number-grid";
import { buildNumberStateMap, resolveNumberStatus } from "../../hooks/use-realtime-campaign";
import { formatCurrency } from "@/lib/format";
import type { CampaignNumber } from "@/types/campaign-number";
import type { Campaign } from "@/types/campaign";

export interface NumberSelectionSectionProps {
  campaign: Campaign;
  numbers: CampaignNumber[];
  now: number;
  selected: ReadonlySet<number>;
  totalValue: number;
  onToggle: (number: number) => void;
  onSelectDragRange: (from: number, to: number) => void;
  onPick: (numbers: number[]) => void;
  selectionDisabled: boolean;
  onOpenCart: () => void;
  onClearSelection?: () => void;
  /** Label do botão principal (default: Ver seleção e continuar) */
  primaryActionLabel?: string;
  requireDoubleTap?: boolean;
  onDoubleClick?: (number: number) => void;
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>, number: number) => void;
  onLongPress?: (number: number) => void;
  /** Esconde o rodapé sticky interno (quando a página já tem barra própria) */
  hideStickyBar?: boolean;
  hint?: string;
}

export function NumberSelectionSection({
  campaign,
  numbers,
  now,
  selected,
  totalValue,
  onToggle,
  onSelectDragRange,
  onPick,
  selectionDisabled,
  onOpenCart,
  onClearSelection,
  primaryActionLabel = "Ver seleção e continuar",
  requireDoubleTap = true,
  onDoubleClick,
  onContextMenu,
  onLongPress,
  hideStickyBar = false,
  hint,
}: NumberSelectionSectionProps) {
  const [filter, setFilter] = useState<NumberFilterValue>("ALL");

  const getStatus = useMemo(() => {
    const stateMap = buildNumberStateMap(numbers);
    return (number: number) => resolveNumberStatus(stateMap.get(number) ?? null, now);
  }, [numbers, now]);

  const controller = useNumberGrid({
    numberStart: campaign.number_start,
    numberEnd: campaign.number_end,
    getStatus,
    filter,
    onFilterChange: setFilter,
  });

  const quantity = selected.size;
  const canContinue = quantity > 0 && !selectionDisabled;

  return (
    <section aria-label="Escolha seus números" className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NumberFilter value={filter} onChange={setFilter} />
        </div>
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <NumberSearch onGoToNumber={controller.goToNumber} />
        </div>
      </div>

      <NumberLegend />

      <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground sm:text-left">
        {hint ??
          (requireDoubleTap
            ? "Toque duas vezes em um número livre para selecionar. No desktop, clique duas vezes ou arraste para marcar vários."
            : "Toque ou clique nos números livres para selecionar.")}
      </p>

      <QuickPick
        campaign={campaign}
        numbers={numbers}
        now={now}
        selectedCount={quantity}
        onPick={onPick}
      />

      <NumberGrid
        campaign={campaign}
        numbers={numbers}
        now={now}
        selected={selected}
        onToggle={onToggle}
        onSelectDragRange={onSelectDragRange}
        selectionDisabled={selectionDisabled}
        controller={controller}
        requireDoubleTap={requireDoubleTap}
        compact
        {...(onDoubleClick ? { onDoubleClick } : { onDoubleClick: onToggle })}
        {...(onContextMenu ? { onContextMenu } : {})}
        {...(onLongPress ? { onLongPress } : {})}
      />

      {!hideStickyBar ? (
        <div
          className={
            quantity > 0
              ? "fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:static sm:rounded-xl sm:border sm:bg-background sm:p-4 sm:shadow-none sm:backdrop-blur-none"
              : "rounded-xl border border-border bg-background p-4"
          }
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Selecionados:{" "}
                <span className="font-semibold text-foreground tabular-nums">{quantity}</span>
              </p>
              <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalValue)}</p>
            </div>
            <div className="flex gap-2">
              {quantity > 0 && onClearSelection ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="min-h-11 flex-1 sm:flex-none"
                  onClick={onClearSelection}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Limpar
                </Button>
              ) : null}
              <Button
                size="lg"
                disabled={!canContinue}
                onClick={onOpenCart}
                className="min-h-11 flex-1 sm:w-auto sm:flex-none"
              >
                <ShoppingCart aria-hidden="true" className="size-4" />
                {primaryActionLabel}
                {quantity > 0 ? ` (${quantity})` : ""}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Espaço para a barra fixa no mobile */}
      {!hideStickyBar && quantity > 0 ? (
        <div className="h-24 sm:hidden" aria-hidden="true" />
      ) : null}
    </section>
  );
}
