/** TanStack Query bindings for the appointment module. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/shared/hooks/use-tenant-id";
import {
  addToWaitingListFn,
  appointmentDetailFn,
  appointmentSummaryFn,
  cancelAppointmentFn,
  confirmAppointmentFn,
  listAppointmentsFn,
  listWaitingListFn,
  markNoShowFn,
  rescheduleAppointmentFn,
  reserveSlotFn,
  retrySyncFn,
  transitionAppointmentFn,
  updateWaitingListStatusFn,
} from "../services/appointments.functions";
import type { AppointmentFiltersValue } from "../types";
import type {
  CancelInput,
  ConfirmInput,
  NoShowInput,
  RescheduleInput,
  ReserveInput,
  TransitionInput,
  WaitingListInput,
} from "../validators";

/** Everything the availability engine + agenda need to refresh. */
export function useInvalidateScheduling() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["appointments"] });
    qc.invalidateQueries({ queryKey: ["availability"] });
    qc.invalidateQueries({ queryKey: ["agenda"] });
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useAppointments(filters: AppointmentFiltersValue) {
  return useQuery({
    queryKey: ["appointments", "list", filters],
    queryFn: () =>
      listAppointmentsFn({
        data: {
          from: filters.from,
          to: filters.to,
          professionalId: filters.professionalId,
          clientId: filters.clientId,
          status: filters.status,
          serviceTypeId: filters.serviceTypeId,
          modality: filters.modality,
          locationId: filters.locationId,
          source: filters.source,
          limit: 200,
        },
      }),
  });
}

export function useAppointmentDetail(appointmentId: string | null) {
  return useQuery({
    queryKey: ["appointments", "detail", appointmentId],
    enabled: !!appointmentId,
    queryFn: () => appointmentDetailFn({ data: { appointmentId: appointmentId! } }),
  });
}

export function useAppointmentSummary(scope: {
  clientId?: string | null;
  professionalId?: string | null;
}) {
  const enabled = Boolean(scope.clientId || scope.professionalId);
  return useQuery({
    queryKey: ["appointments", "summary", scope],
    enabled,
    queryFn: () =>
      appointmentSummaryFn({
        data: { clientId: scope.clientId ?? null, professionalId: scope.professionalId ?? null },
      }),
  });
}

export function useLocations() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ["locations", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, description, room, active")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Maps backend error codes to friendly, translated messages. */
export function useAppointmentError() {
  const { t } = useTranslation();
  return (error: unknown) => {
    const raw = (error as Error)?.message ?? "";
    const code = raw.includes("slot_taken")
      ? "slotTaken"
      : raw.includes("reservation_expired")
        ? "reservationExpired"
        : raw.includes("rule_violation")
          ? "ruleViolation"
          : raw.includes("invalid_transition") || raw.includes("invalid_status_transition")
            ? "invalidTransition"
            : raw.includes("forbidden")
              ? "forbidden"
              : "generic";
    return t(`appointments.errors.${code}`);
  };
}

function useMutationWithFeedback<TInput, TResult>(
  fn: (input: TInput) => Promise<TResult>,
  successKey: string,
) {
  const { t } = useTranslation();
  const invalidate = useInvalidateScheduling();
  const describe = useAppointmentError();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      invalidate();
      toast.success(t(successKey));
    },
    onError: (error) => toast.error(describe(error)),
  });
}

export const useReserveSlot = () =>
  useMutationWithFeedback(
    (data: ReserveInput) => reserveSlotFn({ data }),
    "appointments.feedback.reserved",
  );

export const useConfirmAppointment = () =>
  useMutationWithFeedback(
    (data: ConfirmInput) => confirmAppointmentFn({ data }),
    "appointments.feedback.confirmed",
  );

export const useCancelAppointment = () =>
  useMutationWithFeedback(
    (data: CancelInput) => cancelAppointmentFn({ data }),
    "appointments.feedback.cancelled",
  );

export const useRescheduleAppointment = () =>
  useMutationWithFeedback(
    (data: RescheduleInput) => rescheduleAppointmentFn({ data }),
    "appointments.feedback.rescheduled",
  );

export const useMarkNoShow = () =>
  useMutationWithFeedback(
    (data: NoShowInput) => markNoShowFn({ data }),
    "appointments.feedback.noShow",
  );

export const useTransitionAppointment = () =>
  useMutationWithFeedback(
    (data: TransitionInput) => transitionAppointmentFn({ data }),
    "appointments.feedback.updated",
  );

export const useRetrySync = () =>
  useMutationWithFeedback(
    (data: { appointmentId: string }) => retrySyncFn({ data }),
    "appointments.feedback.synced",
  );

export function useWaitingList() {
  return useQuery({
    queryKey: ["appointments", "waiting-list"],
    queryFn: () => listWaitingListFn(),
  });
}

export const useAddToWaitingList = () =>
  useMutationWithFeedback(
    (data: WaitingListInput) => addToWaitingListFn({ data }),
    "appointments.feedback.waitingListAdded",
  );

export const useUpdateWaitingListStatus = () =>
  useMutationWithFeedback(
    (data: { id: string; status: "waiting" | "contacted" | "scheduled" | "cancelled" }) =>
      updateWaitingListStatusFn({ data }),
    "appointments.feedback.updated",
  );
