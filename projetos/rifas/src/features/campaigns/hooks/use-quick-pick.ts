import { useCallback, useMemo } from "react";

import { buildNumberStateMap, resolveNumberStatus } from "./use-realtime-campaign";
import type { CampaignNumber } from "@/types/campaign-number";
import type { Campaign } from "@/types/campaign";

export const QUICK_PICK_PRESETS = [1, 5, 10, 20, 50, 100] as const;

export interface UseQuickPickOptions {
  campaign: Campaign | null;
  numbers: CampaignNumber[];
  now: number;
  selectedCount: number;
  onPick: (numbers: number[]) => void;
}

export interface QuickPick {
  availableCount: number;
  canPick: boolean;
  pick: (amount: number) => void;
}

/** Seleção aleatória de números disponíveis (nunca repete; respeita o limite por compra). */
export function useQuickPick(options: UseQuickPickOptions): QuickPick {
  const { campaign, numbers, now, selectedCount, onPick } = options;

  const available = useMemo(() => {
    const map = buildNumberStateMap(numbers);
    if (!campaign) return [];
    const result: number[] = [];
    for (let number = campaign.number_start; number <= campaign.number_end; number++) {
      if (resolveNumberStatus(map.get(number) ?? null, now) === "AVAILABLE") {
        result.push(number);
      }
    }
    return result;
  }, [campaign, numbers, now]);

  const canPick = Boolean(
    campaign?.allow_random_selection !== false &&
    campaign?.status === "ACTIVE" &&
    campaign?.visibility === "PUBLIC" &&
    available.length > 0,
  );

  const pick = useCallback(
    (amount: number) => {
      if (!canPick || amount <= 0) return;
      const maxByPurchase =
        campaign?.max_numbers_per_purchase == null
          ? Number.POSITIVE_INFINITY
          : campaign.max_numbers_per_purchase;
      const remaining = Math.max(0, maxByPurchase - selectedCount);
      const count = Math.min(amount, available.length, remaining);
      if (count <= 0) return;
      const pool = [...available];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const current = pool[i];
        const swap = pool[j];
        if (current == null || swap == null) continue;
        pool[i] = swap;
        pool[j] = current;
      }
      onPick(pool.slice(0, count));
    },
    [canPick, campaign, available, selectedCount, onPick],
  );

  return { availableCount: available.length, canPick, pick };
}
