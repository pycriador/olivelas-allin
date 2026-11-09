/** Appointment Management — shared types. */
import type { Database } from "@/integrations/supabase/types";

export type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
export type AppointmentSource = Database["public"]["Enums"]["appointment_source"];
export type BookingType = Database["public"]["Enums"]["appointment_booking_type"];
export type Modality = Database["public"]["Enums"]["appointment_modality"];
export type SyncStatus = Database["public"]["Enums"]["appointment_sync_status"];
export type CancellationReason =
  Database["public"]["Enums"]["appointment_cancellation_reason"];
export type NoShowParty = Database["public"]["Enums"]["no_show_party"];
export type WaitingListStatus = Database["public"]["Enums"]["waiting_list_status"];
export type LocationRow = Database["public"]["Tables"]["locations"]["Row"];
export type WaitingListRow = Database["public"]["Tables"]["waiting_list"]["Row"];
export type StatusHistoryRow =
  Database["public"]["Tables"]["appointment_status_history"]["Row"];

export type AppointmentPermission =
  | "appointments.view"
  | "appointments.create"
  | "appointments.edit"
  | "appointments.cancel"
  | "appointments.reschedule"
  | "appointments.complete"
  | "appointments.no_show"
  | "appointments.fit_in"
  | "appointments.delete"
  | "waiting_list.view"
  | "waiting_list.manage";

export interface AppointmentListItem extends AppointmentRow {
  client_name: string | null;
  professional_name: string | null;
  service_type_name: string | null;
  location_name: string | null;
}

export interface AppointmentDetail extends AppointmentListItem {
  history: StatusHistoryRow[];
}

export interface AppointmentFiltersValue {
  from: string;
  to: string;
  professionalId: string | null;
  clientId: string | null;
  status: AppointmentStatus | null;
  serviceTypeId: string | null;
  modality: Modality | null;
  locationId: string | null;
  source: AppointmentSource | null;
}

export interface ReservationResult {
  appointmentId: string;
  reservedUntil: string;
  warnings: string[];
}

export interface AppointmentActionResult {
  appointmentId: string;
  status: AppointmentStatus;
  syncStatus: SyncStatus;
  syncMessage?: string | null;
}
