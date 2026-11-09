import { useCallback, useMemo } from "react";

import { buildNumberStateMap, resolveNumberStatus } from "./use-realtime-campaign";
import type { CampaignNumber } from "@/types/campaign-number";
import type { Campaign } from "@/types/campaign";

export interface ReservationValidationResult {
  valid: boolean;
  errors: string[];
}

export interface UseReservationValidationOptions {
  campaign: Campaign | null;
  numbers: CampaignNumber[];
  now: number;
  hasActiveReservation: boolean;
}

/** Valida um lote antes de reservar: número existente, disponível, campanha ativa, limites. */
export function useReservationValidation(options: UseReservationValidationOptions) {
  const { campaign, numbers, now, hasActiveReservation } = options;
  const stateMap = useMemo(() => buildNumberStateMap(numbers), [numbers]);

  return useCallback(
    (candidate: number[]): ReservationValidationResult => {
      const errors: string[] = [];
      if (!campaign) {
        errors.push("Campanha não encontrada.");
        return { valid: false, errors };
      }
      if (campaign.status !== "ACTIVE" || campaign.visibility !== "PUBLIC") {
        errors.push("Esta campanha não está aberta para reservas no momento.");
      }
      if (hasActiveReservation) {
        errors.push("Cancele a reserva atual antes de selecionar outros números.");
      }
      if (candidate.length === 0) {
        errors.push("Selecione ao menos um número.");
      } else {
        if (
          campaign.max_numbers_per_purchase != null &&
          candidate.length > campaign.max_numbers_per_purchase
        ) {
          errors.push(
            `Limite de ${campaign.max_numbers_per_purchase} números por compra ultrapassado.`,
          );
        }
        const outOfRange = candidate.filter(
          (number) => number < campaign.number_start || number > campaign.number_end,
        );
        if (outOfRange.length > 0) {
          errors.push("Um ou mais números selecionados estão fora da faixa da campanha.");
        }
        const unavailable = candidate.filter(
          (number) => resolveNumberStatus(stateMap.get(number) ?? null, now) !== "AVAILABLE",
        );
        if (unavailable.length > 0) {
          errors.push(`Números indisponíveis: ${unavailable.join(", ")}.`);
        }
      }
      return { valid: errors.length === 0, errors };
    },
    [campaign, stateMap, now, hasActiveReservation],
  );
}
