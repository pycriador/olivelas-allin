import { useState, type FormEvent } from "react";
import { Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuickPick, QUICK_PICK_PRESETS } from "../../hooks/use-quick-pick";
import type { CampaignNumber } from "@/types/campaign-number";
import type { Campaign } from "@/types/campaign";

export interface QuickPickProps {
  campaign: Campaign;
  numbers: CampaignNumber[];
  now: number;
  selectedCount: number;
  onPick: (numbers: number[]) => void;
}

export function QuickPick({ campaign, numbers, now, selectedCount, onPick }: QuickPickProps) {
  const { availableCount, canPick, pick } = useQuickPick({
    campaign,
    numbers,
    now,
    selectedCount,
    onPick,
  });
  const [custom, setCustom] = useState("");

  function handleCustomSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = Number(custom.trim());
    if (Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > 0) {
      pick(parsed);
    }
    setCustom("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Shuffle aria-hidden="true" className="size-3.5" />
        Escolher automaticamente
      </span>
      {QUICK_PICK_PRESETS.map((amount) => (
        <Button
          key={amount}
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPick}
          onClick={() => pick(amount)}
        >
          {amount}
        </Button>
      ))}
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="Qtd"
          aria-label="Quantidade personalizada"
          className="h-8 w-20 px-2 text-sm"
          disabled={!canPick}
        />
        <Button type="submit" variant="outline" size="sm" disabled={!canPick || custom === ""}>
          Selecionar
        </Button>
      </form>
      <span className="text-xs text-muted-foreground">{availableCount} disponíveis</span>
    </div>
  );
}
