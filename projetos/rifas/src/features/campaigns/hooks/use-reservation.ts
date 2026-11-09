import { useCallback, useEffect, useMemo, useState } from "react";

import { useReservationValidation } from "./use-reservation-validation";
import { buildNumberStateMap, resolveNumberStatus } from "./use-realtime-campaign";
import { campaignNumberService } from "@/services/campaign-number.service";
import type { ActiveReservation, CampaignNumber, ReservationResult } from "@/types/campaign-number";
import type { Campaign } from "@/types/campaign";

export interface UseReservationOptions {
  campaignId: string | null;
  campaign: Campaign | null;
  numbers: CampaignNumber[];
  now: number;
}

export interface ReservationController {
  guestId: string;
  selected: ReadonlySet<number>;
  selectedList: number[];
  isSelected: (number: number) => boolean;
  toggle: (number: number) => void;
  select: (numbers: number[]) => void;
  clearSelection: () => void;
  selectDragRange: (from: number, to: number) => void;
  isReserving: boolean;
  reserve: () => Promise<ReservationResult>;
  reservation: ActiveReservation | null;
  cancelReservation: () => Promise<number>;
  conflicts: number[];
  clearConflicts: () => void;
  totalValue: number;
}

function rangeBetween(from: number, to: number): number[] {
  const low = Math.min(from, to);
  const high = Math.max(from, to);
  const result: number[] = [];
  for (let n = low; n <= high; n++) result.push(n);
  return result;
}

/** Orquestra seleção de números, reserva temporária, expiração e conflitos. */
export function useReservation(options: UseReservationOptions): ReservationController {
  const { campaignId, campaign, numbers, now } = options;
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [reservation, setReservation] = useState<ActiveReservation | null>(null);
  const [conflicts, setConflicts] = useState<number[]>([]);
  const [isReserving, setIsReserving] = useState(false);

  const guestId = useMemo(() => campaignNumberService.getOrCreateGuestId(), []);
  const stateMap = useMemo(() => buildNumberStateMap(numbers), [numbers]);

  const validate = useReservationValidation({
    campaign,
    numbers,
    now,
    hasActiveReservation: reservation !== null,
  });

  // Remove da seleção números que deixaram de estar disponíveis em tempo real
  // (reservados por outro cliente) e registra como conflito.
  useEffect(() => {
    if (reservation) return;
    const unavailable = [...selected].filter(
      (number) => resolveNumberStatus(stateMap.get(number) ?? null, now) !== "AVAILABLE",
    );
    if (unavailable.length === 0) return;
    setSelected((previous) => {
      const next = new Set(previous);
      for (const number of unavailable) next.delete(number);
      return next;
    });
    setConflicts((previous) => [...new Set([...previous, ...unavailable])]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numbers, now, reservation, stateMap]);

  const toggle = useCallback(
    (number: number) => {
      if (reservation) return;
      if (resolveNumberStatus(stateMap.get(number) ?? null, now) !== "AVAILABLE") return;
      setSelected((previous) => {
        const next = new Set(previous);
        if (next.has(number)) next.delete(number);
        else next.add(number);
        return next;
      });
    },
    [stateMap, now, reservation],
  );

  const selectDragRange = useCallback(
    (from: number, to: number) => {
      if (reservation) return;
      const candidates = rangeBetween(from, to).filter(
        (number) => resolveNumberStatus(stateMap.get(number) ?? null, now) === "AVAILABLE",
      );
      setSelected(new Set(candidates));
    },
    [stateMap, now, reservation],
  );

  const select = useCallback(
    (numbers: number[]) => {
      if (reservation) return;
      const addable = numbers.filter(
        (number) => resolveNumberStatus(stateMap.get(number) ?? null, now) === "AVAILABLE",
      );
      if (addable.length === 0) return;
      setSelected((previous) => {
        const next = new Set(previous);
        for (const number of addable) next.add(number);
        return next;
      });
    },
    [stateMap, now, reservation],
  );

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const reserve = useCallback(async (): Promise<ReservationResult> => {
    if (!campaign || !campaignId) {
      return { ok: false, error: "UNKNOWN", message: "Campanha inválida." };
    }
    const candidates = [...selected].sort((a, b) => a - b);
    const validation = validate(candidates);
    if (!validation.valid) {
      return { ok: false, error: "UNKNOWN", message: validation.errors.join(" ") };
    }
    setIsReserving(true);
    try {
      const result = await campaignNumberService.reserve(campaignId, candidates, guestId);
      if (result.ok && result.token) {
        const numbersReserved = result.numbers ?? candidates;
        setReservation({
          token: result.token,
          reservedBy: guestId,
          reservedUntil:
            result.reserved_until ??
            new Date(Date.now() + campaign.reservation_timeout_minutes * 60_000).toISOString(),
          timeoutMinutes: result.timeout_minutes ?? campaign.reservation_timeout_minutes,
          numbers: numbersReserved,
          total: numbersReserved.length * campaign.price_per_number,
        });
        setSelected(new Set());
        return result;
      }
      if (result.error === "CONFLICT" && result.numbers && result.numbers.length > 0) {
        setConflicts(result.numbers);
        setSelected((previous) => {
          const next = new Set(previous);
          for (const number of result.numbers ?? []) next.delete(number);
          return next;
        });
      }
      return result;
    } finally {
      setIsReserving(false);
    }
  }, [campaign, campaignId, selected, guestId, validate]);

  const cancelReservation = useCallback(async () => {
    if (!reservation) return 0;
    const cancelled = await campaignNumberService.cancelReservation(reservation.token, guestId);
    setReservation(null);
    return cancelled;
  }, [reservation, guestId]);

  const clearConflicts = useCallback(() => setConflicts([]), []);

  const selectedList = useMemo(() => [...selected].sort((a, b) => a - b), [selected]);

  const isSelected = useCallback((number: number) => selected.has(number), [selected]);

  const totalValue = useMemo(() => {
    if (!campaign) return 0;
    return selectedList.length * campaign.price_per_number;
  }, [campaign, selectedList]);

  return {
    guestId,
    selected,
    selectedList,
    isSelected,
    toggle,
    select,
    clearSelection,
    selectDragRange,
    isReserving,
    reserve,
    reservation,
    cancelReservation,
    conflicts,
    clearConflicts,
    totalValue,
  };
}

/** Limpeza periódica de reservas expiradas (fallback do cliente para o job do banco). */
export function useReleaseExpired(intervalMs = 60_000): () => Promise<number> {
  useEffect(() => {
    let mounted = true;
    const release = async () => {
      if (!mounted) return;
      try {
        await campaignNumberService.releaseExpired();
      } catch {
        // falhas de limpeza são toleradas — o job do banco cobre.
      }
    };
    void release();
    const id = window.setInterval(() => void release(), intervalMs);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [intervalMs]);
  return useCallback(() => campaignNumberService.releaseExpired(), []);
}
